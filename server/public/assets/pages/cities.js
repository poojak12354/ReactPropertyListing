$("#btn_submit").click(function(e){
    var valid = 1;
    e.preventDefault();
    $(".error").remove();
    var name = $('#city_name');
    name.removeClass('parsley-error');

    if(name.val().trim() == ""){
        valid = 0;
        var datakey = name.data('key');
        name.addClass('parsley-error');
        name.after('<span class="error">'+datakey+' is required</span>');
    }

    if(valid == 1){
        $("#manage_city").submit();
    }
});

$(document).on('click','#searchterm', function(){
    var term = $('#tb_search').val().trim();
    if(term == ""){
        window.location.href="/cities";
    } else {
        window.location.href="/cities?search="+term;
    }
});

var searchinput = document.getElementById("tb_search");

searchinput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    var term = $('#tb_search').val().trim();
    if(term == ""){
        window.location.href="/cities";
    } else {
        window.location.href="/cities?search="+term;
    }
  }
});

$(document).on('click','#delete_entry', function () {
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
            var id = $this.data('id');
            $.ajax({
                type : "POST",
                url : "/delete-record",
                dataType: 'json',
                data : {
                    action: 'delete_city',
                    id:id
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