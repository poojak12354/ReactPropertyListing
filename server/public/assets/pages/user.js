Dropzone.autoDiscover = false;
var myDropzone = new Dropzone(".dropzone", {
    url: '/upload-avatar',
   autoProcessQueue: false,
   uploadMultiple: false,
   maxFiles:2,
   maxFilesize: 2,
   createImageThumbnails:false,
   hiddenInputContainer: "#profileimg",
   renameFile: function (file) {
        var username = $("#username").val();
        var cur_time = new Date().getTime();
        let newName =  username+'_'+cur_time+'_'+file.name;
        return newName;
    },
    init: function(file) {
        var prevFile = null;
        this.on("addedfile", function(file) {
            var $this = this;
            setTimeout(function () {
                if(file.status == "error"){
                    $this.removeFile($this.files[0]);
                } else {
                    if(prevFile){
                        $this.removeFile($this.files[0])
                    }
                    prevFile = file;
                    $("#profileimg").val(file.upload.filename);
                    previewImage($this);
                }
            }, 10);
        });
        this.on('error', function(file, errorMessage) {
            alert('Unable to upload '+file.name+'. '+errorMessage);
        });
        this.on("queuecomplete", function(file, res) {
            var $this = this;
            
            if(myDropzone.files.length > 0 && myDropzone.files[0].status == Dropzone.SUCCESS && myDropzone.getQueuedFiles().length <= 1){
                $("#add_new_user").submit();
            } else {
                //$this.removeFile($this.files[0]);
            }
        });
    }
});

function previewImage(input){
    let fileReference = input.files && input.files[0];
    if(fileReference){
        var reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('ws_user_avatar').src = event.target.result;
        }
        reader.readAsDataURL(fileReference); 
    }
}

$(document).on('click','#remove_img', function(){
    prevFile = null;
    if(myDropzone.getQueuedFiles().length > 0){
        myDropzone.removeFile(myDropzone.files[0]);
    }
    $("#profileimg").val('');
    $("#ws_user_avatar").attr('src', $("#ws_user_avatar").data('thumb'));
});

$(document).on('click','#btn_submit', function(e){
    var valid = 1;
    e.preventDefault();
    $('#add_new_user input[type="text"], #add_new_user input[type="number"], #add_new_user input[type="password"], #add_new_user input[type="email"], #add_new_user select').each(function(){
        var inputval = $(this).val().trim();
        if(inputval == ""){
            valid = 0;
            var datakey = $(this).data('key');
            $(this).addClass('parsley-error');
            $(this).after('<span class="error">'+datakey+' is required</span>');
        } else {
            var match = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if($(this).attr('type') == "email" && !match.test(inputval)){
                valid = 0;
                $(this).addClass('parsley-error');
                $(this).after('<span class="error">Please provide a valid email address.</span>');
            } else {
                $(this).removeClass('parsley-error');
                $(this).closest('div').find('span.error').remove();
            }
        }
    });

    if(valid == 1){
        $.ajax({
            type : "POST",
            url : "/validate-user-form",
            dataType: 'json',
            data : {
                action: 'user_form_validate',
                username: $('#username').val().trim(),
                phone: $('#phone').val().trim(),
                email: $('#email').val().trim(),
                frmID: $("#frm_id").val(),
            },
            success: function(response) {
                var dosubmit=1;
                if(response.email != "success"){
                    dosubmit=0;
                    $('#email').addClass('parsley-error');
                    $('#email').after('<span class="error">'+response.email+'</span>');
                } else {
                    $('#email').removeClass('parsley-error');
                    $('#email').closest('div').find('span.error').remove();
                }
                if(response.user != "success"){
                    dosubmit=0;
                    $('#username').addClass('parsley-error');
                    $('#username').after('<span class="error">'+response.user+'</span>');
                } else {
                    $('#username').removeClass('parsley-error');
                    $('#username').closest('div').find('span.error').remove();
                }
                if(response.phone != "success"){
                    dosubmit=0;
                    $('#phone').addClass('parsley-error');
                    $('#phone').after('<span class="error">'+response.phone+'</span>');
                } else {
                    $('#phone').removeClass('parsley-error');
                    $('#phone').closest('div').find('span.error').remove();
                }
                if(dosubmit == 1){
                    if(myDropzone.getQueuedFiles().length > 0){
                        myDropzone.processQueue();
                    } else {
                        $("#add_new_user").submit();
                    }
                }
            }
        });
    }
});