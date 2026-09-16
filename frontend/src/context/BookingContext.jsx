import React, { createContext, useContext, useState } from 'react';

export const DEFAULT_GROUND = {
  _id: '67b600000000000000000001',
  name: 'Green Box Cricket',
  location: 'Gachibowli, Hyderabad',
  description: 'Premier floodlit artificial turf box cricket ground with professional grade turf and safety nets.',
  pricePerSlot: 600,
  peakPrice: 900,
  openTime: '06:00',
  closeTime: '23:00',
  images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80'],
  amenities: ['Floodlights', 'Parking', 'Pro Gear', 'Seating Dugout', 'Drinking Water', 'Washroom'],
};

const BookingContext = createContext(null);

// Format date object to "DD-MM-YYYY"
function toDDMMYYYY(d = new Date()) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function BookingProvider({ children }) {
  const [selectedGround, setSelectedGround] = useState(DEFAULT_GROUND);
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
