$(document).on('click','#delete_user', function () {
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
            var uid = $this.data('uid');
            $.ajax({
                type : "POST",
                url : "/delete-record",
                dataType: 'json',
                data : {
                    action: 'delete_user',
                    id:uid
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

$(document).on('click','#change_status',function () {
    var $this = $(this);
    var status = $this.attr('title');
    swal({
        title: 'Are you sure?',
        text: "You want to "+status+" this user!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonClass: 'btn btn-success',
        cancelButtonClass: 'btn btn-danger m-l-10',
        confirmButtonText: 'Yes, '+status+' it!'
    }).then(function (isConfirm) {
        if (isConfirm) {
            var uid = $this.data('uid');
            var code = $this.data('status');
            $.ajax({
                type : "POST",
                url : "/change-status",
                dataType: 'json',
                data : {
                    action: 'change_user_status',
                    id:uid,
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
    window.location.href="/users?search="+term;
});

var searchinput = document.getElementById("tb_search");

searchinput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    var term = $('#tb_search').val().trim();
    window.location.href="/users?search="+term;
  }
});

$(document).on('click','#mark_certified',function () {
    var $this = $(this);
    var status = $this.data('title');
    swal({
        title: 'Are you sure?',
        text: "You want to "+status.toLowerCase()+" this user!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonClass: 'btn btn-success',
        cancelButtonClass: 'btn btn-danger m-l-10',
        confirmButtonText: 'Yes, '+status.toLowerCase()+'!'
    }).then(function (isConfirm) {
        if (isConfirm) {
            var uid = $this.data('uid');
            var code = $this.data('status');
            $.ajax({
                type : "POST",
                url : "/change-status",
                dataType: 'json',
                data : {
                    action: 'user_certified',
                    id:uid,
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