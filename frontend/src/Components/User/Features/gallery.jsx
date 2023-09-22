import React, { useCallback, useState } from 'react';
import ShowGallery from '../../Upload/showGallery';
import FileUpload from '../../Upload/uploadFiles';
const Gallery = () => {
    const [images, setImages] = useState([]);
    const onDrop = useCallback((acceptedFiles,key) => {
      console.log('key',key);
      acceptedFiles.map((file, index) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          setImages((prevState) => [
            ...prevState,
            { id: index, src: e.target.result, type: file.type, source: file},
          ]);
        };
        reader.readAsDataURL(file);
        return file;
      });
    }, []);

    const removeImage = (index) =>{
      //const { name, value } = event.currentTarget;
      const imgArr = [...images];
      imgArr.splice(index, 1);
      setImages(imgArr);      
    }
  return (
      <>
        <FileUpload onDrop={onDrop} showLabel="1" acceptType='{"image/png": [".png"],"image/jpeg": [".jpg",".jpeg"],"video/mp4": [".mp4"],"video/webm": [".webm"],"video/ogg": [".ogg"]}' rowIndex='0'/>
        <ShowGallery images={images} clickEvent={removeImage} className="thumb-lg img-thumbnail fill mt-3"/>
      </>
  );
}
export default Gallery;