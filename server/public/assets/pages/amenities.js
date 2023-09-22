document.addEventListener('DOMContentLoaded', function(event) {
    var uip = new UniversalIconPicker('#select_icon', {
        iconLibraries: [
        'happy-icons.min.json',
        'font-awesome.min.json',
        'feather-icons.min.json',
        'zondicons.min.json',
        'elegant-icons.min.json',
        'weather-icons.min.json',
        'tabler-icons.min.json'
        ],
        iconLibrariesCss: [
        'happy-icons.min.css',
        'fontawesome-all.min.css',
        'feather-icons.min.css',
        'zondicons.min.css',
        'elegant-icons.min.css',
        'weather-icons.min.css',
        'tabler-icons.min.css'
        ],
        resetSelector: '#remove_icon',
        onSelect: function(jsonIconData) {
            document.getElementById('output_icon').innerHTML = jsonIconData.iconHtml;
            document.getElementById('icon_html').innerHTML = jsonIconData.iconHtml;
            document.getElementById('output').classList.remove('d-none');
        },
        onReset: function() {
            document.getElementById('output_icon').innerHTML = '';
            document.getElementById('icon_html').innerHTML = '';
            document.getElementById('output').classList.add('d-none');
        }
    });
});

$("#btn_submit").click(function(e){
    var valid = 1;
    e.preventDefault();
    $(".error").remove();
    var name = $('#amenities_name');
    var icon_html = $('#icon_html');
    name.removeClass('parsley-error');

    if(name.val().trim() == ""){
        valid = 0;
        var datakey = name.data('key');
        name.addClass('parsley-error');
        name.after('<span class="error">'+datakey+' is required</span>');
    }

    if(icon_html.val().trim() == ""){
        valid = 0;
        var datakey = icon_html.data('key');
        icon_html.closest('.form-group').append('<div class="error">'+datakey+' is required</div>');
    }

    if(valid == 1){
        $("#manage_amenities").submit();
    }
});

$(document).on('click','#searchterm', function(){
    var term = $('#tb_search').val().trim();
    if(term == ""){
        window.location.href="/amenities";
    } else {
        window.location.href="/amenities?search="+term;
    }
});

var searchinput = document.getElementById("tb_search");

searchinput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    var term = $('#tb_search').val().trim();
    if(term == ""){
        window.location.href="/amenities";
    } else {
        window.location.href="/amenities?search="+term;
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
                    action: 'delete_amenity',
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