var feature_template = '<div class="row"><div class="col-md-5"><div class="form-group"><label class="form-label" for="title">Title</label><input type="text" class="form-control" name="title" id="title" placeholder="Title" autocomplete="off" autofill="false" value=""></div></div><div class="col-md-5"><div class="form-group"><label class="form-label" for="description">Description</label><input type="text" class="form-control" name="description" id="description" placeholder="Description" autocomplete="off" autofill="false" value=""></div></div><div class="col-md-2 d-table"><div class="d-table-cell align-middle"><button type="button" id="del_item" class="btn mt-2"><i class="fas fa-trash"></i></button></div></div></div>';

var specification_row = '<tr><td class="align-top"><div class="form-group"><label class="form-label" for="title">Heading</label><input type="text" class="form-control" name="heading" id="heading" placeholder="Heading" autocomplete="off" autofill="false" value=""></div></td><td><div id="feature_list">'+feature_template+'</div><button type="button" id="add_more_featues" class="btn btn-primary w-md float-right"><i class="fas fa-plus"></i> Add More</button></td><td><button type="button" id="del_row" class="btn"><i class="fas fa-trash"></i></button></td></tr>';

var video_html = '<tr><td class="align-top"><div class="form-group"><label class="form-label" for="in_gallery">Include in gallery?</label><div class="form-check form-switch form-switch-md form-group"><input type="checkbox" class="form-check-input" id="in_gallery" name="in_gallery" value="1"></div></div></td><td class="align-top"><div class="form-group"><label class="form-label" for="title">Video Url</label><input type="text" class="form-control" name="video_url" id="video_url" placeholder="Video Url" autocomplete="off" autofill="false" value=""></div></td><td><button type="button" id="del_video" class="btn"><i class="fas fa-trash"></i></button></td></tr>';

var delete_media = [], delete_plans_media =[];
var submission_type= $("#manage_form").data('type');

Dropzone.autoDiscover = false;

/**************************** Document Upload *********************************/
var prevFile = null;
var docDropzone = new Dropzone(".dropzone.upload-doc", {
    url: '/upload-gallery?action=document',
    autoProcessQueue: false,
    uploadMultiple: false,
    maxFiles:2,
    maxFilesize: 10,
    createImageThumbnails:false,
    disablePreviews: true,
    acceptedFiles: 'application/pdf',
    renameFile: function (file) {
        let newName = new Date().getTime() + '_' + file.name;
        return newName;
    },
    init: function(file) {
        prevFile = null;
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
                    $("#hdn_document").val(file.upload.filename);
                    previewDocument(file);
                }
            }, 10);
        });
        this.on('error', function(file, errorMessage) {
            alert('Unable to upload '+file.name+'. '+errorMessage);
        });
        this.on("queuecomplete", function(file, res) {
            var $this = this;
            
            if(docDropzone.getQueuedFiles().length <= 1 && docDropzone.files[0].status == Dropzone.SUCCESS){
                $('#manage_form').submit();
            } else {
                $this.removeFile($this.files[0]);
            }
        });
    }
});

var prevPlanFile = {},plansdropzone = {};
$("#tbl_plans tbody tr").each(function(){
    var index_val = $(this).find('button.dropzone').data('index');
    if(index_val >= 0){
        initializeDropzonePlans(index_val);
    }
});

function initializeDropzonePlans(index_val){
    plansdropzone["plan_"+index_val] = new Dropzone(".dropzone.upload-plan-"+index_val, {
        url: '/upload-gallery?action=images&type='+submission_type,
        autoProcessQueue: false,
        uploadMultiple: false,
        maxFiles:2,
        maxFilesize: 10,
        createImageThumbnails:false,
        disablePreviews: true,
        acceptedFiles: 'image/*',
        renameFile: function (file) {
            let newName = new Date().getTime() + '_' + file.name;
            return newName;
        },
        init: function(file) {
            prevPlanFile['file_'+index_val] = null;
            this.on("addedfile", function(file) {
                var $this = this;
                setTimeout(function () {
                    if(file.status == "error"){
                        $this.removeFile($this.files[0]);
                    } else {
                        if(prevPlanFile['file_'+index_val]){
                            $this.removeFile($this.files[0])
                        }
                        prevPlanFile['file_'+index_val] = file;
                        previewPlan(file,index_val);
                    }
                }, 10);
            });
            this.on('error', function(file, errorMessage) {
                alert('Unable to upload '+file.name+'. '+errorMessage);
            });
            this.on("queuecomplete", function(file, res) {
                var $this = this;
                
                if(plansdropzone["plan_"+index_val].getQueuedFiles().length <= 1 && plansdropzone["plan_"+index_val].files[0].status == Dropzone.SUCCESS){
                    console.log('Plan media uploaded successfully');
                } else {
                    $this.removeFile($this.files[0]);
                }
            });
        }
    });
}

function previewPlan(input,ele_index){
    let fileReference = input;
    var filename = fileReference.upload.filename;
    if(fileReference){
        $("#hdn_plan_"+ele_index).val(filename);
        var reader = new FileReader();
        reader.onload = (event) => {
            $("#drz_preview_"+ele_index).html('<div class="lc-img-container d-inline-flex"><img src="'+event.target.result+'" class="w-100 mt-3" data-file="'+filename+'" data-type="image"/><a href="javascript:void(0)" data-index="'+ele_index+'" id="remove_plan_img" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></div>');
        }
        reader.readAsDataURL(fileReference); 
    }
}

var myDropzone = new Dropzone(".dropzone.upload-gallery", {
    url: '/upload-gallery?action=images&type='+submission_type,
    autoProcessQueue: false,
    uploadMultiple: true,
    createImageThumbnails:false,
    disablePreviews: true,
    acceptedFiles: 'image/*,video/mp4,video/webm,video/ogg',
    renameFile: function (file) {
        let newName = new Date().getTime() + '_' + file.name;
        return newName;
    },
    init: function(file) {
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
        this.on('error', function(file, errorMessage) {
            alert('Unable to upload '+file.name+'. '+errorMessage);
        });
        this.on("queuecomplete", function(file, res) {
            var $this = this;
            if(myDropzone.getQueuedFiles().length <= 1 && myDropzone.files[0].status == Dropzone.SUCCESS){
                if(docDropzone.getQueuedFiles().length > 0){
                    docDropzone.processQueue();
                } else {
                    $("#manage_form").submit();
                }
            } else {
                $this.removeFile($this.files[0]);
            }
        });
    }
});

function previewImage(input){
    let fileReference = input;
    var filename = fileReference.upload.filename;
    if(fileReference.type != "video/mp4" && fileReference.type != "video/mov" && fileReference.type != "video/avi"){
        if(fileReference){
            var reader = new FileReader();
            reader.onload = (event) => {
                $("#drz_gallery").append('<div class="lc-img-container d-inline-flex mr-2"><img src="'+event.target.result+'" class="thumb-lg img-thumbnail mt-3" data-file="'+filename+'" data-type="image"/><a href="javascript:void(0)" id="remove_img" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></div>');
            }
            reader.readAsDataURL(fileReference); 
        }
    } else {
        $("#drz_gallery").append('<div class="lc-img-container d-inline-flex mr-2"><img src="/public/assets/images/video.jpg" class="thumb-lg img-thumbnail mt-3" data-file="'+filename+'" data-type="video"/><a href="javascript:void(0)" id="remove_img" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></div>');
    }
}

$(document).on('click','#remove_img', function(){
    var $this = $(this);
    if(myDropzone.getQueuedFiles().length > 0){
        myDropzone.getQueuedFiles().forEach(function (file,index) {  
            if($this.data('file') == file.upload.filename){
                myDropzone.removeFile(myDropzone.files[index]);
            }
        });
    }

    if($('#delete_media').length > 0){
        var prevValue = $this.data('file');
        var del_media = {'type': 'media', 'name': prevValue};
        delete_media.push(del_media);
    }

    $this.closest('.lc-img-container').remove();
});

function previewDocument(input){
    let fileReference = input;
    var filename = fileReference.upload.filename;
    $("#drz_document").html('<div class="lc-img-container d-inline-flex mr-2"><p>'+filename+' <a href="javascript:void(0)" id="remove_doc" data-file="'+filename+'"><i class="fas fa-times-circle"></i></a></p></div>');
}


$(document).on('click','#remove_doc', function(){
    var $this = $(this);
    prevFile = null;
    if(docDropzone.getQueuedFiles().length > 0){
        docDropzone.removeFile(docDropzone.files[0]);
    }
    if($('#delete_media').length > 0){
        var prevValue = $("#hdn_document").val();
        var del_media = {'type': 'doc', 'name': prevValue};
        delete_media.push(del_media);
    }
    $("#hdn_document").val('');
    $this.closest('.lc-img-container').remove();
});

$(document).on('click','#remove_plan_img', function(){
    var $this = $(this);
    var index_val = $this.data('index');
    prevPlanFile['file_'+index_val] = null;
    if(plansdropzone["plan_"+index_val].getQueuedFiles().length > 0){
        plansdropzone["plan_"+index_val].removeFile(plansdropzone["plan_"+index_val].files[0]);
    }

    if($('#delete_plan_media').length > 0){
        var prevValue = $("#hdn_plan_"+index_val).val();
        delete_plans_media.push(prevValue);
    }
    $("#hdn_plan_"+index_val).val('');
    $this.closest('.lc-img-container').remove();
});

function initializeEditor(selector){
    tinymce.init({
        selector: "textarea"+selector,
        theme: "modern",
        height:300,
        plugins: [
            "advlist autolink link image lists charmap print preview hr anchor pagebreak spellchecker",
            "searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking",
            "save table contextmenu directionality emoticons template paste textcolor"
        ],
        toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | print preview media fullpage | forecolor backcolor emoticons",
        style_formats: [
            {title: 'Bold text', inline: 'b'},
            {title: 'Red text', inline: 'span', styles: {color: '#ff0000'}},
            {title: 'Red header', block: 'h1', styles: {color: '#ff0000'}},
            {title: 'Example 1', inline: 'span', classes: 'example1'},
            {title: 'Example 2', inline: 'span', classes: 'example2'},
            {title: 'Table styles'},
            {title: 'Table row 1', selector: 'tr', classes: 'tablerow1'}
        ]
    });
}

$(document).ready(function () {
    $('#neighbourhood,#ameneties').select2({
        width: "100%",
        templateSelection: iformat,
        templateResult: iformat,
        allowHtml: true,
        placeholder: {
            id: '', // the value of the option
            text: 'Select an option'
        }
    });
    if($("#form_content").length > 0){
        initializeEditor("#form_content");
    }

    if($(".floor-plans").length > 0){
        initializeEditor(".floor-plans");
    }

    window.initMap = initMap;
});

function iformat(icon) {
    
    var originalOption = icon.element;
    var iconHtml = $(originalOption).data('icon');
    if(iconHtml != undefined){
        return $('<span>'+$(originalOption).data('icon')+' ' + icon.text + '</span>');
    } else {
        return $('<span>' + icon.text + '</span>');
    }
}


$(document).on('click','#add_more_specifications',function(){
    $("#tbl_specifications tbody").append(specification_row);
    $("#tbl_specifications tbody tr:last").find('.d-table').html('');
});

$(document).on('click','#del_row,#del_video',function(){
    $(this).closest('tr').remove();
});

$(document).on('click','#add_more_featues',function(){
    $(this).closest('td').find("#feature_list").append(feature_template);
});

$(document).on('click','#del_item',function(){
    $(this).closest('div.row').remove();
});

$(document).on('click','#add_more_video', function(){
    $("#tbl_videos tbody").append(video_html);
});

$(document).on('click','#add_more_plans', function(){
    var row_num = $("#tbl_plans tbody tr:last").find('textarea').data('index');

    var new_num = parseInt(row_num) + 1;
    var plan_html = '<tr><td class="align-top"><div class="form-group"><label class="form-label" for="plan_title">Title</label><input type="text" class="form-control" name="plan_title" id="plan_title" placeholder="eg. 2BHK" autocomplete="off" autofill="false" value=""></div></td><td class="align-top"><div class="form-group"><label class="form-label" for="plan_content">Plan Details</label><textarea id="plan_content_'+row_num+'" name="plan_content" data-index="'+new_num+'"></textarea></div><div class="row"><div class="col-md-4"> <button type="button" class="dropzone wss-hidepreview upload-plan-'+row_num+' only-button mt-3 align-top" data-index="'+row_num+'">Choose Plan Image</button><input type="hidden" name="hdn_plan_'+row_num+'" id="hdn_plan_'+row_num+'"/></div><div class="col-md-8"><div class="dropzone-previews d-inline" id="drz_preview_'+row_num+'"></div></div></td><td><button type="button" id="del_plan" class="btn"><i class="fas fa-trash"></i></button></td></tr>';

    $("#tbl_plans tbody").append(plan_html);

    setTimeout(function () {
        initializeEditor('#plan_content_'+row_num);
        initializeDropzonePlans(row_num);
    }, 10);
});

$(document).on('click','#del_plan',function(){
    var input_id = $(this).closest('tr').find('textarea').attr('id');
    var index_val = $(this).closest('tr').find('textarea').data('index');
    index_val = parseInt(index_val) - 1;
    tinymce.EditorManager.execCommand('mceRemoveEditor', true, input_id);
    plansdropzone["plan_"+index_val].destroy();
    prevPlanFile['file_'+index_val] = null;
    if($('#delete_plan_media').length > 0){
        var prevValue = $("#hdn_plan_"+index_val).val();
        delete_plans_media.push(prevValue);
    }
    $(this).closest('tr').remove();
});

function initMap() {
    var map_lat = $("#loc_lat").val() == "" ? 30.733315 : parseFloat($("#loc_lat").val());
    var map_long = $("#loc_long").val() == "" ? 76.779419 : parseFloat($("#loc_long").val());
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: map_lat, lng: map_long },
        zoom: $("#loc_long").val() != "" ? 19 : 13,
        mapTypeControl: true,
    });

    const input = document.getElementById("property_location");
    const options = {
        fields: ["formatted_address", "geometry", "icon", "name"],
        strictBounds: false,
        types: ["establishment"],
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);

    autocomplete.bindTo("bounds", map);

    const infowindow = new google.maps.InfoWindow();
    const infowindowContent = document.getElementById("infowindow-content");

    infowindow.setContent(infowindowContent);
    
    const marker = new google.maps.Marker({
        position: new google.maps.LatLng(map_lat, map_long),
        map,
        draggable: true,
        anchorPoint: new google.maps.Point(0, -29),
    });

    google.maps.event.addListener(marker, 'dragend', function(evt) {
        
        geocoder = new google.maps.Geocoder();
        geocoder.geocode
        ({
            latLng: evt.latLng
        }, 
            function(results, status) 
            {
                if (status == google.maps.GeocoderStatus.OK) 
                {
                    lat = evt.latLng.lat().toFixed(6),
                    long = evt.latLng.lng().toFixed(6);
                    $('#loc_lat').val(lat);
                    $('#loc_long').val(long);
                    $('#loc_detail').val(results[0].formatted_address);
                    infowindowContent.children["place-name"].textContent = '';
                    infowindowContent.children["place-address"].textContent = results[0].formatted_address;
                    var locationAdr = results[0].formatted_address;
                    $("#view_on_map").attr("href", 'https://www.google.com/maps/place/'+locationAdr.replace(/ /g,"+")+'/@'+lat+','+long+',17z');
                    infowindow.open(map, marker);
                } 
                else 
                {
                    alert('Cannot determine address at this location.'+status);
                }
            }
        );
    });

    map.setCenter(marker.position);
    marker.setMap(map);

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });

    autocomplete.addListener("place_changed", () => {
        infowindow.close();
        marker.setVisible(false);

        const place = autocomplete.getPlace();
        var place_name = place.name;
        
        if (!place.geometry || !place.geometry.location) {
            window.alert("No details available for input: '" + place_name + "'");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
        
        //infowindowContent.children["place-name"].textContent = place_name;
        $('#loc_name').val(place_name);
        $('#loc_detail').val(place.formatted_address);
        var lat = place.geometry.location.lat().toFixed(6);
        var long = place.geometry.location.lng().toFixed(6);
        $('#loc_lat').val(lat);
        $('#loc_long').val(long);
        infowindowContent.children["place-name"].textContent = place_name;
        infowindowContent.children["place-address"].textContent = place.formatted_address;
        $("#view_on_map").attr("href", 'https://www.google.com/maps/place/'+place_name.replace(/ /g,"+")+'/@'+lat+','+long+',17z');
        infowindow.open(map, marker);
    });
}

$(document).on('click', '#btn_submit', function(e){
    var $button = $(this);
    $button.attr('disabled','disabled');
    var valid = 1;
    e.preventDefault();
    $('input.required,select.required').each(function(){
        var inputval = $(this).val().trim();
        if(inputval == ""){
            valid = 0;
            var datakey = $(this).data('key');
            $(this).addClass('parsley-error');
            if($(this).closest('div').find('span.error').length == 0){
                $(this).after('<span class="error">'+datakey+' is required</span>');
            }
        } else {
            $(this).removeClass('parsley-error');
            $(this).closest('div').find('span.error').remove();
        }
    });
    
    if(valid == 1){
        swal({
            title: "Processing..",
            html: '<div class="sweet_loader"><svg viewBox="0 0 140 140" width="140" height="140"><g class="outline"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="rgba(0,0,0,0.1)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></g><g class="circle"><path d="m 70 28 a 1 1 0 0 0 0 84 a 1 1 0 0 0 0 -84" stroke="#71BBFF" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dashoffset="200" stroke-dasharray="300"></path></g></svg></div>',
            showCancelButton: false,
        });
        
        var additional_features = [], videos_data = [], plans_data = [], gallery_images = [];
        $("#tbl_specifications tbody tr").each(function(){
            var $this = $(this);
            var feature = {};
            var feature_list = [];
            var heading = $this.find("#heading").val().trim();
            $this.find("#feature_list .row").each(function(){
                var fetaure_title = $(this).find("#title").val().trim();
                var fetaure_desc = $(this).find("#description").val().trim();
                if(fetaure_desc != "" && fetaure_title != ""){
                    var row = {'title': fetaure_title, 'desc': fetaure_desc};
                    feature_list.push(row);
                }
            });
            if(heading != "" && feature_list.length > 0){
                feature['heading'] = heading;
                feature["feature_list"] = feature_list;
                additional_features.push(feature);
            }
        });
        if(additional_features.length > 0){
            $("#add_specs").val(JSON.stringify(additional_features));
        }

        $("#tbl_videos tbody tr").each(function(){
            var $this = $(this);
            var vid_url = $this.find('#video_url').val().trim();
            if(vid_url != ""){
                var in_gallery = $this.find("#in_gallery").prop('checked');
                var row = {'in_gallery': in_gallery ? 1 : 0, 'video_url': vid_url};
                videos_data.push(row);
            }
        });
        if(videos_data.length > 0){
            $("#vid_data").val(JSON.stringify(videos_data));
        }

        $("#tbl_plans tbody tr").each(function(ele,index){
            
            var $this = $(this);
            var title = $this.find('#plan_title').val().trim();
            if(title != ""){
                var editor_id = $this.find('textarea').attr('id');
                var image_index = $this.find('textarea').data('index');
                image_index = parseInt(image_index) - 1;
                var row = {'plan_title': title, 'plan_desc': tinyMCE.editors[editor_id].getContent(),'image': $this.find('#hdn_plan_'+image_index).val().trim()};
                plans_data.push(row);
                if(plansdropzone["plan_"+image_index].getQueuedFiles().length > 0){
                    plansdropzone["plan_"+image_index].processQueue();
                }
            }
        });

        if(plans_data.length > 0){
            $("#plans_data").val(JSON.stringify(plans_data));
        }
        
        if(delete_media.length > 0 && $('#delete_media').length > 0){
            $("#delete_media").val(JSON.stringify(delete_media));
        }
        
        if(delete_plans_media.length > 0 && $('#delete_plan_media').length > 0){
            $("#delete_plan_media").val(JSON.stringify(delete_plans_media));
        }

        $("#drz_gallery .lc-img-container").each(function(){
            var file_name = $(this).find('img').data('file');
            var type = $(this).find('img').data('type');
            var datarow = {'type': type,'name': file_name};
            gallery_images.push(datarow);
        });
        if(gallery_images.length > 0){
            $('#hdn_gallery').val(JSON.stringify(gallery_images));
        }

        if(myDropzone.getQueuedFiles().length > 0 || docDropzone.getQueuedFiles().length > 0){            
            if(myDropzone.getQueuedFiles().length > 0){
                myDropzone.options.autoProcessQueue = true;
                myDropzone.processQueue();
            } else {
                if(docDropzone.getQueuedFiles().length > 0){
                    docDropzone.processQueue();
                } else {
                    $("#manage_form").submit();
                }
            }
        } else {
            $("#manage_form").submit();
        }
    } else {
        $button.removeAttr('disabled');
    }
});