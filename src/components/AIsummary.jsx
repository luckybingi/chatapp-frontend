
// import  { useState } from "react";

// const SummaryModal = ({ onClose, onGenerate }) => {
//   const [start, setStart] = useState("");
//   const [end, setEnd] = useState("");

//   const handleGenerate = () => {
//     if (!start || !end) {
//       alert("Please select both start and end date/time");
//       return;
//     }
//     onGenerate(start, end);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
//       <div className="bg-white text-black p-6 rounded-lg w-full max-w-md shadow-lg relative">
//         <h2 className="text-xl font-semibold mb-4 text-center">📅 Select Time Range</h2>

//         <div className="flex flex-col gap-4 mb-4">
//           <div>
//             <label className="block mb-1 font-medium">Start Date & Time:</label>
//             <input
//               type="datetime-local"
//               value={start}
//               onChange={(e) => setStart(e.target.value)}
//               className="border px-2 py-1 rounded w-full"
//             />
//           </div>

//           <div>
//             <label className="block mb-1 font-medium">End Date & Time:</label>
//             <input
//               type="datetime-local"
//               value={end}
//               onChange={(e) => setEnd(e.target.value)}
//               className="border px-2 py-1 rounded w-full"
//             />
//           </div>
//         </div>

//         <div className="flex justify-end gap-2">
//           <button
//             className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-1 px-4 rounded"
//             onClick={onClose}
//           >
//             Cancel
//           </button>

//           <button
//             className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded"
//             onClick={handleGenerate}
//           >
//             Generate Summary
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SummaryModal;

