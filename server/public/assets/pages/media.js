Dropzone.autoDiscover = false;
var myDropzone = new Dropzone(".dropzone", {
    url: '/upload-gallery?action=media',
    autoProcessQueue: false,
    uploadMultiple: true,
    createImageThumbnails:false,
    disablePreviews: true,
    acceptedFiles: 'image/*,video/mp4,video/webm,video/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    renameFile: function (file) {
        let newName = new Date().getTime() + '_' + file.name;
        return newName;
    },
    init: function(file) {
        var $dropzoneThis = this;
        this.on("addedfile", function(file) {
            var $this = this;
            setTimeout(function () {
                if(file.status == "error"){
                    $this.removeFile($this.files[0]);
                } else {
                    previewImage(file);
                }
            }, 10);
        });
        this.on("addedfiles", function(files) {
            if(files.length > 0){
                myDropzone.options.autoProcessQueue = true;
                $dropzoneThis.processQueue();
            }
        });
        this.on('error', function(file, errorMessage) {
            alert('Unable to upload '+file.name+'. '+errorMessage);
        });
        this.on("queuecomplete", function(file, res) {
            var $this = this;
            if(myDropzone.files[0].status == Dropzone.SUCCESS && myDropzone.getQueuedFiles().length <= 1){
                //myDropzone.options.autoProcessQueue = false;
            } else {
                $this.removeFile($this.files[0]);
            }
        });
    }
});

function previewImage(input){
    let fileReference = input;
    var filename = fileReference.upload.filename;
    switch(fileReference.type){
        case "video/mp4":
        case "video/webm":
        case "video/ogg":
            $("#drz_gallery").prepend('<div class="lc-img-container d-inline-flex mr-2"><img src="/public/assets/images/video.jpg" class="thumb-lg img-thumbnail mt-3" title="'+site_url+'/uploads/media/site_media/'+filename+'" data-dt="'+new Date(Date.now()).toLocaleString()+'" data-type="video"/><a href="javascript:void(0)" id="remove_img" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></div>');
        break;
        case "application/pdf":
            $("#drz_gallery").prepend('<div class="lc-img-container d-inline-flex mr-2"><img src="/public/assets/images/pdf.png" class="thumb-lg img-thumbnail mt-3" title="'+site_url+'/uploads/media/site_media/'+filename+'" data-dt="'+new Date(Date.now()).toLocaleString()+'" data-type="pdf"/><a href="javascript:void(0)" id="remove_img" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></div>');
        break;
        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            $("#drz_gallery").prepend('<div class="lc-img-container d-inline-flex mr-2"><img src="/public/assets/images/doc.png" class="thumb-lg img-thumbnail mt-3" title="'+site_url+'/uploads/media/site_media/'+filename+'" data-dt="'+new Date(Date.now()).toLocaleString()+'" data-type="doc"/><a href="javascript:void(0)" id="remove_img" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></div>');
        break;
        default:
            if(fileReference){
                var reader = new FileReader();
                reader.onload = (event) => {
                    $("#drz_gallery").prepend('<div class="lc-img-container d-inline-flex mr-2"><img src="'+event.target.result+'" class="thumb-lg img-thumbnail mt-3" title="'+site_url+'/uploads/media/site_media/'+filename+'" data-dt="'+new Date(Date.now()).toLocaleString()+'" data-type="image"/><a href="javascript:void(0)" id="remove_img" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></div>');
                }
                reader.readAsDataURL(fileReference); 
            }
        break;
    }
}

$(document).on('click','#remove_img', function(){
    var $this = $(this);
    var filename = $this.data('file');
    swal({
        title: 'Are you sure?',
        text: "You want to this file!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonClass: 'btn btn-success',
        cancelButtonClass: 'btn btn-danger m-l-10',
        confirmButtonText: 'Yes, delete it!'
    }).then(function (isConfirm) {
        if (isConfirm) {
            $.ajax({
                type : "POST",
                url : "/delete-record",
                dataType: 'json',
                data : {
                    action: 'delete_site_media',
                    id:filename,
                },
                success: function(response) {
                    var msgtype = response.status == "success" ? "Done" : "Error";
                    swal({
                        title: msgtype,
                        type: response.status,
                        text: response.msg,
                        showCancelButton: false,
                    }).then(function(){
                        if(msgtype == "Done")
                        {
                            $this.closest('.lc-img-container').remove();
                        }
                    });
                }
            });
        }
    });
});

var searchinput = document.getElementById("tb_search");

searchinput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    var term = $('#tb_search').val().trim();
    window.location.href="/media?search="+term;
  }
});

$(document).on('click', '.img-thumbnail', function(){
    var image_url = $(this).attr('title');
    var uplaoded_at = $(this).data('dt');
    var uplaod_type = $(this).data('type');
    var view_html = '';
    switch(uplaod_type){
        case "video":
            view_html = '<video class="w-100" controls><source src="'+image_url+'" type="video/mp4"><source src="'+image_url+'" type="video/ogg"><source src="'+image_url+'" type="video/webm">Your browser does not support the video tag.</video>';
        break;
        case "pdf":
            view_html = '<img src="/public/assets/images/pdf.png"/>';
        break;
        case "doc":
            view_html = '<img src="/public/assets/images/doc.png"/>';
        break;
        default:
            view_html = '<img src="'+image_url+'" class="popup-img"/>';
        break;
    }
    var popuphtml = '<div class="row mt-3"><div class="col-12">'+view_html+'</div><div class="col-12 mt-4"><div class="form-group"><div class="row"><div class="col-4 text-left"><label class="form-label">Url: </label></div><div class="col-8"><input class="form-control disabled" readonly value="'+image_url+'"/></div></div></div><div class="form-group"><div class="row"><div class="col-4 text-left"><label class="form-label">Uploaded On: </label></div><div class="col-8 text-left"><i class="fas fa-calendar"></i> <i>'+uplaoded_at+'</i></div></div></div></div></div>';
    swal({
        title: '',
        html: popuphtml,
        customClass: 'swal-wide',
        showCloseButton: true,
        showCancelButton: false,
        showConfirmButton: false
    }).catch(swal.noop);
});