import { useDropzone } from 'react-dropzone';
import Styles from './Upload.module.scss';

const UploadFiles = ({ onDrop, showLabel, acceptType, rowIndex }) => {
    const {
        getRootProps,
        getInputProps,
        acceptedFiles,
        open,
        isdragaccept,
        isfocused,
        isdragreject,
    } = useDropzone({
        onDrop: (acceptedFiles) => onDrop(acceptedFiles, rowIndex),
        noClick: true,
        noKeyboard: true,
        accept: JSON.parse(acceptType)
    });
    return (
    <>
        {' '}
        <section className={Styles.dropbox}>
            <div className={Styles.dropbox} {...getRootProps({ isdragaccept, isfocused, isdragreject })}>
                <input {...getInputProps()} accept={acceptType}/>
                <p className={showLabel == 1 ? '' : 'd-none'}>Upload your files here</p>
                <button type="button" className="btn" onClick={open}>
                    Click to select file
                </button>
            </div>
        </section>
    </>
    );
}
export default UploadFiles;