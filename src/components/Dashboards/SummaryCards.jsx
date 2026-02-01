import React from 'react'

const SummaryCards = ({ icon, text, number,color }) => {
  return (
    <div className="flex bg-white rounded-lg shadow-md overflow-hidden">
      {/* Icon section */}
      <div className={`text-3xl flex justify-center items-center ${color} text-white px-4`}>
        {icon}
      </div>

      {/* Text section */}
      <div className="pl-4 py-2">
        <p className="text-lg font-semibold">{text}</p>
        <p className="text-2xl font-bold">{number}</p>
      </div>
    </div>
  )
}

export default SummaryCards
