var sweet_loader = '<div class="sweet_loader"><svg viewBox="0 0 140 140" width="140" height="140"><g class="outline"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="rgba(0,0,0,0.1)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></g><g class="circle"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="#71BBFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dashoffset="200" stroke-dasharray="300"></path></g></svg></div>';
$(document).on('click','#delete_project', function () {
    var $this = $(this);
    swal({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonClass: 'btn btn-success',
        cancelButtonClass: 'btn btn-danger m-l-10',
        confirmButtonText: 'Yes, delete it!'
    }).then(function (isConfirm) {
        if (isConfirm) {
            var pid = $this.data('id');
            var del_type = $("#manage_listing").data('type');
            swal({
                title: "Processing..",
                html: '<div class="sweet_loader"><svg viewBox="0 0 140 140" width="140" height="140"><g class="outline"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="rgba(0,0,0,0.1)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></g><g class="circle"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="#71BBFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dashoffset="200" stroke-dasharray="300"></path></g></svg></div>',
                showCancelButton: false,
            });
            $.ajax({
                type : "POST",
                url : "/delete-record",
                dataType: 'json',
                data : {
                    action: del_type == 'project' ? 'delete_project' : 'delete_property',
                    id:pid
                },
                success: function(response) {
                    swal.close();
                    var msgtype = response.status == "success" ? "Done" : "Error";
                    setTimeout(function(){
                        swal({
                            title: msgtype,
                            type: response.status,
                            text: response.msg,
                            showCancelButton: false,
                        }).then(function(){
                            if(msgtype == "Done")
                            {
                                window.location.reload();
                            }
                        });
                    });
                },
                error(error){
                    console.log('error',error);
                    swal.close();
                    setTimeout(function(){
                        swal({
                            title: 'Error!',
                            text: 'Something went wrong!',
                            type: 'error',
                            showCancelButton: false,
                        });
                    },10);
                }
            });
        }
    }).catch(swal.noop);
});

$(document).on('click','#change_status',function () {
    var $this = $(this);
    var status = $this.attr('title');
    var ptype = $("#manage_listing").data('type');
    swal({
        title: 'Are you sure?',
        text: "You want to "+status+" this "+ptype+"!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonClass: 'btn btn-success',
        cancelButtonClass: 'btn btn-danger m-l-10',
        confirmButtonText: 'Yes, '+status+' it!'
    }).then(function (isConfirm) {
        if (isConfirm) {
            var pid = $this.data('id');
            var code = $this.data('status');
            $.ajax({
                type : "POST",
                url : "/change-status",
                dataType: 'json',
                data : {
                    action: ptype == 'project' ? 'change_project_status' : 'change_property_status',
                    id:pid,
                    code:code
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
                            window.location.reload();
                        }
                    });
                }
            });
        }
    }).catch(swal.noop);
});

$(document).on('click','#searchterm', function(){
    var term = $('#tb_search').val().trim();
    var p_type = $("#manage_listing").data('type');
    window.location.href= p_type == "project" ? "/projects?search="+term : "/properties?search="+term;
});

var searchinput = document.getElementById("tb_search");

searchinput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    var p_type = $("#manage_listing").data('type');
    var term = $('#tb_search').val().trim();
    window.location.href = p_type == "project" ? "/projects?search="+term : "/properties?search="+term;
  }
});