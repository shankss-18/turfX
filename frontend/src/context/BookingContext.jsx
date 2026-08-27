import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

// Format date object to "DD-MM-YYYY"
function toDDMMYYYY(d = new Date()) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function BookingProvider({ children }) {
  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => toDDMMYYYY(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [lastBooking, setLastBooking] = useState(null);

  // Backward compatibility: selectedSlot is the first slot in selectedSlots
  const selectedSlot = selectedSlots.length > 0 ? selectedSlots[0] : null;
  const setSelectedSlot = (slot) => {
    if (!slot) setSelectedSlots([]);
    else setSelectedSlots(Array.isArray(slot) ? slot : [slot]);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedGround,
        setSelectedGround,
        selectedDate,
        setSelectedDate,
        selectedSlots,
        setSelectedSlots,
        selectedSlot,
        setSelectedSlot,
        lastBooking,
        setLastBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
