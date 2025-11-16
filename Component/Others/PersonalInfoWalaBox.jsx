import React from 'react'

const PersonalInfoWalaBox = ({keyy, value}) => {
  return (
    <div className="p-5 bg-gray-100 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">{keyy}</p>
            <p className="font-semibold text-gray-800">{value}</p>
          </div>
  )
}

export default PersonalInfoWalaBox