// import React, { useState } from "react";

// interface SvgUploaderProps {
//   onImageUpload: (image: string) => void;
// }

// const SvgUploader: React.FC<SvgUploaderProps> = ({ onImageUpload }) => {
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         // Handle image upload
//         onImageUpload(e.target?.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div className="svg-uploader">
//       <input
//         type="file"
//         accept=".svg,image/*"
//         onChange={handleFileUpload}
//         style={{ display: "none" }}
//         id="file-input"
//       />
//       <button className="upload-button" onClick={() => document.getElementById('file-input')?.click()}>
//         Upload SVG or Image
//       </button>
//     </div>
//   );
// };

// export default SvgUploader;
