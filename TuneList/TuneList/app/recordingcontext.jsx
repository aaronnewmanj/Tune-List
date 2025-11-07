import React, { createContext, useState } from 'react';

export const RecordingContext = createContext();

export function RecordingProvider({ children }) {
  const [recordings, setRecordings] = useState([]);
  return (
    <RecordingContext.Provider value={{ recordings, setRecordings }}>
      {children}
    </RecordingContext.Provider>
  );
}
