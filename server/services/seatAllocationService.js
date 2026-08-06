/**
 * seatAllocationService.js
 * Implementation of Segment-Based Seat Allocation Algorithm with DP
 */

/**
 * Helper to generate physical seats for a class based on its capacity.
 * e.g., if total_seats = 4, returns [{coach: 'A1', seatNumber: 1}, ...]
 */
function getPhysicalSeats(totalSeats) {
  const seats = [];
  // For simplicity, assume coach A1 for everything, seats 1 to totalSeats
  for (let i = 1; i <= totalSeats; i++) {
    seats.push({ coach: 'A1', seatNumber: i });
  }
  return seats;
}

/**
 * Main DP Algorithm to find minimum seat changes
 * dp[i] = minimum number of seat allocations to travel from i to destination
 */
function findMinSeatChangeDP(sourceIdx, destIdx, availableSegmentsPerSeat, physicalSeats) {
  const n = destIdx;
  
  // dp[i] stores { minAllocations: int, nextStop: int, seat: Object }
  const dp = new Array(n + 1).fill(null);
  
  // Base case: at destination, 0 allocations needed
  dp[n] = { minAllocations: 0, nextStop: n, seat: null };
  
  // Iterate backwards from destIdx - 1 down to sourceIdx
  for (let i = n - 1; i >= sourceIdx; i--) {
    let bestOption = null;
    
    // Try every physical seat
    for (const seat of physicalSeats) {
      const seatKey = `${seat.coach}-${seat.seatNumber}`;
      const occupiedSegments = availableSegmentsPerSeat[seatKey] || new Set();
      
      // If seat is occupied at starting segment i, we can't use it
      if (occupiedSegments.has(i)) continue;
      
      // Find the farthest we can go with this seat before it's occupied or we reach destination
      let j = i + 1;
      while (j < n && !occupiedSegments.has(j)) {
        j++;
      }
      
      // Now we can go from i to j using this seat.
      // Total allocations = 1 (this seat for i->j) + dp[j].minAllocations
      if (dp[j] !== null) {
        const allocations = 1 + dp[j].minAllocations;
        
        // Prefer fewer allocations.
        // Tie-breaker: longer continuous run (higher j), lower seat number
        if (!bestOption || allocations < bestOption.minAllocations) {
          bestOption = { minAllocations: allocations, nextStop: j, seat: seat };
        } else if (allocations === bestOption.minAllocations) {
          if (j > bestOption.nextStop) {
            bestOption = { minAllocations: allocations, nextStop: j, seat: seat };
          } else if (j === bestOption.nextStop && seat.seatNumber < bestOption.seat.seatNumber) {
            bestOption = { minAllocations: allocations, nextStop: j, seat: seat };
          }
        }
      }
    }
    
    dp[i] = bestOption;
  }
  
  // If dp[sourceIdx] is null, no path exists
  if (!dp[sourceIdx]) return null;
  
  // Reconstruct path
  const allocations = [];
  let currentIdx = sourceIdx;
  
  while (currentIdx < destIdx) {
    const step = dp[currentIdx];
    allocations.push({
      fromIndex: currentIdx,
      toIndex: step.nextStop,
      coach: step.seat.coach,
      seatNumber: step.seat.seatNumber
    });
    currentIdx = step.nextStop;
  }
  
  return {
    seatChangeCount: allocations.length - 1,
    allocations: allocations
  };
}

/**
 * Service to allocate seats for multiple passengers
 * maxSeatChanges: The maximum number of seat changes the user has accepted (defaults to 0)
 */
async function allocateSeatsTransaction(connection, trainId, travelDate, classCode, sourceStationId, destStationId, passengers, maxSeatChanges = 0) {
  // 1. Fetch train route and map stations to indexes
  const [routeRows] = await connection.query(
    'SELECT station_id, stop_number, distance_from_source, (SELECT code FROM stations WHERE id = station_id) as station_code FROM train_routes WHERE train_id = ? ORDER BY stop_number ASC',
    [trainId]
  );
  
  let sourceIndex = -1;
  let destIndex = -1;
  const indexToStation = {};
  const indexToDistance = {};
  
  for (const stop of routeRows) {
    indexToStation[stop.stop_number] = stop.station_code;
    indexToDistance[stop.stop_number] = stop.distance_from_source;
    if (stop.station_id === sourceStationId) sourceIndex = stop.stop_number;
    if (stop.station_id === destStationId) destIndex = stop.stop_number;
  }
  
  if (sourceIndex === -1 || destIndex === -1 || sourceIndex >= destIndex) {
    throw new Error('Invalid source or destination station for this train.');
  }

  const requestedJourneyDistance = indexToDistance[destIndex] - indexToDistance[sourceIndex];

  // 2. Lock inventory row to serialize concurrent bookings for this train/date/class
  await connection.query(
    'SELECT * FROM booking_inventory WHERE train_id = ? AND travel_date = ? AND class_code = ? FOR UPDATE',
    [trainId, travelDate, classCode]
  );

  // 3. Get total seats and base fare for this class
  const [classRows] = await connection.query(
    'SELECT total_seats, base_fare FROM train_classes WHERE train_id = ? AND class_code = ?',
    [trainId, classCode]
  );
  if (classRows.length === 0) throw new Error('Class not found');
  const totalSeats = classRows[0].total_seats;
  const baseFare = parseFloat(classRows[0].base_fare) || 0;
  const physicalSeats = getPhysicalSeats(totalSeats);

  // 4. Fetch existing allocations for these segments
  const [allocationRows] = await connection.query(
    `SELECT coach, seat_number, segment_index 
     FROM seat_allocations 
     WHERE train_id = ? AND travel_date = ? AND class_code = ? 
     AND segment_index >= ? AND segment_index < ?`,
    [trainId, travelDate, classCode, sourceIndex, destIndex]
  );

  const occupiedSegmentsPerSeat = {};
  for (const row of allocationRows) {
    const key = `${row.coach}-${row.seat_number}`;
    if (!occupiedSegmentsPerSeat[key]) occupiedSegmentsPerSeat[key] = new Set();
    occupiedSegmentsPerSeat[key].add(row.segment_index);
  }

  const finalAllocations = []; 
  let totalCalculatedFare = 0;
  let maxChangesRequiredByAnyPassenger = 0;
  const suggestedChangeStations = new Set();

  // 5. Run allocation algorithm per passenger
  for (const passenger of passengers) {
    let passengerPlan = null;
    
    // First, try to find a continuous seat
    for (const seat of physicalSeats) {
      const key = `${seat.coach}-${seat.seatNumber}`;
      const occupied = occupiedSegmentsPerSeat[key] || new Set();
      
      let isContinuousFree = true;
      for (let i = sourceIndex; i < destIndex; i++) {
        if (occupied.has(i)) {
          isContinuousFree = false;
          break;
        }
      }
      
      if (isContinuousFree) {
        passengerPlan = {
          seatChangeCount: 0,
          totalSegmentFare: baseFare, // No change, standard base fare
          allocations: [{
            fromIndex: sourceIndex,
            toIndex: destIndex,
            coach: seat.coach,
            seatNumber: seat.seatNumber
          }]
        };
        break;
      }
    }

    // If no continuous seat, run DP for minimum seat change
    if (!passengerPlan) {
      passengerPlan = findMinSeatChangeDP(sourceIndex, destIndex, occupiedSegmentsPerSeat, physicalSeats);
      
      if (passengerPlan) {
        // Calculate new fare with seat changes
        let newPassengerFare = 0;
        for (const alloc of passengerPlan.allocations) {
          const segmentDist = indexToDistance[alloc.toIndex] - indexToDistance[alloc.fromIndex];
          const segmentFare = Math.ceil((segmentDist / requestedJourneyDistance) * baseFare) + 50; // 50 is the convenience fee for splitting tickets
          newPassengerFare += segmentFare;
          
          if (alloc.toIndex !== destIndex) {
            suggestedChangeStations.add(indexToStation[alloc.toIndex]);
          }
        }
        passengerPlan.totalSegmentFare = newPassengerFare;
      }
    }

    // If still no plan, waitlist immediately
    if (!passengerPlan) {
      return { status: 'WAITLISTED', allocations: [] };
    }

    maxChangesRequiredByAnyPassenger = Math.max(maxChangesRequiredByAnyPassenger, passengerPlan.seatChangeCount);
    totalCalculatedFare += passengerPlan.totalSegmentFare;

    // Mark these segments as occupied for the next passenger in this same transaction
    for (const alloc of passengerPlan.allocations) {
      const key = `${alloc.coach}-${alloc.seatNumber}`;
      if (!occupiedSegmentsPerSeat[key]) occupiedSegmentsPerSeat[key] = new Set();
      for (let i = alloc.fromIndex; i < alloc.toIndex; i++) {
        occupiedSegmentsPerSeat[key].add(i);
      }
      alloc.fromStation = indexToStation[alloc.fromIndex];
      alloc.toStation = indexToStation[alloc.toIndex];
      alloc.segmentFare = Math.ceil(((indexToDistance[alloc.toIndex] - indexToDistance[alloc.fromIndex]) / requestedJourneyDistance) * baseFare) + (passengerPlan.seatChangeCount > 0 ? 50 : 0);
    }

    finalAllocations.push({
      passengerId: passenger.id || null, // Ensure frontend passes passenger id or we can match it later
      passengerName: passenger.name || 'TestPassenger',
      status: passengerPlan.seatChangeCount > 0 ? 'CONFIRMED_WITH_SEAT_CHANGE' : 'CONFIRMED',
      seatChangeCount: passengerPlan.seatChangeCount,
      totalFare: passengerPlan.totalSegmentFare,
      allocations: passengerPlan.allocations
    });
  }

  // 6. Check maxSeatChanges enforcement BEFORE inserting
  if (maxChangesRequiredByAnyPassenger > maxSeatChanges) {
    // Abort the transaction and return the suggestion payload
    const error = new Error('REQUIRES_SEAT_CHANGE');
    error.payload = {
      status: 'REQUIRES_SEAT_CHANGE',
      maxChangesRequired: maxChangesRequiredByAnyPassenger,
      suggestedChangeStations: Array.from(suggestedChangeStations),
      newTotalFare: totalCalculatedFare,
      baseFare: baseFare * passengers.length,
      message: `No continuous seats available. Journey can be completed with ${maxChangesRequiredByAnyPassenger} seat change(s) at ${Array.from(suggestedChangeStations).join(', ')}. New fare: ₹${totalCalculatedFare}.`
    };
    throw error;
  }

  // 7. Insert all segment allocations into database (Only if accepted limit)
  for (const plan of finalAllocations) {
    for (const alloc of plan.allocations) {
      for (let i = alloc.fromIndex; i < alloc.toIndex; i++) {
        await connection.query(
          `INSERT INTO seat_allocations 
           (train_id, travel_date, class_code, coach, seat_number, segment_index) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [trainId, travelDate, classCode, alloc.coach, alloc.seatNumber, i]
        );
      }
    }
  }

  return {
    status: finalAllocations.some(p => p.seatChangeCount > 0) ? 'CONFIRMED_WITH_SEAT_CHANGE' : 'CONFIRMED',
    totalFare: totalCalculatedFare,
    passengerAllocations: finalAllocations
  };
}

module.exports = {
  allocateSeatsTransaction,
  findMinSeatChangeDP
};
