import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
      <h1>Test Component</h1>
      <p>If you can see this, the basic React rendering is working.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'lightgray' }}>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TestComponent;
