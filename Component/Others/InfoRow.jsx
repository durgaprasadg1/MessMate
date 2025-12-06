import React from 'react'

const InfoRow = ({ label, value, valueClass }) => (
  <div className="flex justify-between border-b pb-2">
    <span className="font-medium text-gray-700">{label}:</span>
    <span className={`text-gray-900 ${valueClass}`}>{value}</span>
  </div>
);

export default InfoRow