﻿var imagesLoaded = false,
    formLoaded = false,
    images = [];
function setupHandlers() {
    $("#Name").on("input", function (e) {
        var name = $(this).val();
        $("#preview-name").text(name);
        localStorage.setItem("title", name);
        checkAddButton();
    });
    $("#Description").on("change", function (e) {
        var desc = $(this).val();
        $("#preview-description").html(desc);
        checkAddButton();
    });
    $("#upload-file").on("click", function (e) {
        e.preventDefault();
        $("#file").trigger("click");
    });
    $("#save-images").on("click", function (e) {
        var form = $("#picture-form"),
            imageInput = document.getElementById("file");

        // Disable all input
        $("#save-images").html("Uploading...");
        $("#save-images").prop("disabled", true);
        $("#Name").prop("readonly", "readonly");
        $("#upload-file").prop("disabled", true);
        CKEDITOR.instances["Description"].setReadOnly(true);
        
        hidePreviewImages();
        readImages(imageInput, form);
    });
    $("#picture-form").submit(function (e) {
    });
    $("#back").click(function (e) {
        $("#main-image").slideDown();
        $("#header-content").slideDown();
        $("#add-photos").show();
        if (formLoaded) {
            $("#picture-form").slideUp();
            $("#image-preview").slideUp();
        }
    });
}
function checkAddButton() {
    var name = $("#Name").val(),
        desc = $("#Description").val();

    if (name && desc) {
            $("#save-images").html("Save");
            $("#save-images").prop("disabled", false);
            $("#save-images").show();
    } else {
        $("#save-images").hide();
    }
}
function createPreview() {
    $(".image-preview").slideDown();
}
function readURL(input) {
    if (input.files && input.files[0]) {
        $("#img-grid-label").show();
        $("#img-grid").show();
        $.each(input.files, function (index, element) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#img-grid').prepend("<img src='" + e.target.result + "' class='preview-image' />");

                if (index === input.files.length - 1) {
                    // Tell the user that the images can now be saved.
                    imagesLoaded = true;
                }
                checkAddButton();
            };

            reader.readAsDataURL(this);
        });
    }
}
function loadSessionValues() {
    if (localStorage.getItem("title")) {
        $("#preview-name").html(localStorage.getItem("title"));
        $("#Name").val(localStorage.getItem("title"));
    }

    if (localStorage.getItem("desc")) {
        $("#preview-description").html(localStorage.getItem("desc"));
        $("#Description").val(localStorage.getItem("desc"));
    }
}
function implementCkeditor() {
    CKEDITOR.replace("Description", {
        toolbarGroups: [
				{ "name": "basicstyles", "groups": ["basicstyles"] },
				{ "name": "links", "groups": ["links"] },
				{ "name": "paragraph", "groups": ["list", "blocks"] },
				{ "name": "styles", "groups": ["styles"] },
				{ "name": "about", "groups": ["about"] }
        ],
        // Remove the redundant buttons from toolbar groups defined above.
        removeButtons: 'Anchor'
    });
    CKEDITOR.instances["Description"].on("change", function () {
        CKEDITOR.instances["Description"].updateElement();
        $("#Description").val(CKEDITOR.instances["Description"].getData());
        var desc = CKEDITOR.instances["Description"].getData();
        
        // Save the values in a session in case they close the page
        localStorage.setItem("desc", desc);
        $("#preview-description").html(desc);
        checkAddButton();
    })
}
function loadForm() {
    var partialView = $("#temp").html();
    $(partialView).appendTo($(".image-form")).hide().slideDown();
    $("#temp").remove();
    $("#add-photos").hide();
    createPreview();
    setupHandlers();
    formLoaded = true;
    implementCkeditor();
    loadSessionValues();
}
function readImages(input, form) {
    if (input.files && input.files.length > 0) {
        var previewImages = $("#img-grid").children();

        $.each(input.files, function (index, object) {
            var FR = new FileReader();
            FR.onload = function (e) {
                sendToImgur(e.target.result, previewImages[index], input.files.length);
            };
            FR.readAsDataURL(object);
        });
    } else {
        localStorage.clear();
        $("#picture-form")[0].submit();
    }
}

function resizeImage(img) {
    var MAX_WIDTH = 600,
        MAX_HEIGHT = 800,
        width = img.width,
        height = img.height;

    if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
    }
    var canvas = $("#image-resizer")[0];

    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpg");

}

function hidePreviewImages() {
    var photos = $("#img-grid").children();

    if (photos.length > 0) {
        $.each(photos, function (i, e) {
            $(e).fadeTo(500, 0.5);
        });
    }
}

function uploadPost() {
    var fileInput = $("#file");
    fileInput.replaceWith(fileInput = fileInput.clone(true));

    $.each(images, function (i, element) {
        $("#hidden-pictures").val(function (i, val) {
            return val + (!val ? "" : ", ") + element;
        });
    });
    localStorage.clear();
    $("#picture-form")[0].submit();
}



function imgurTest(input) {
    var base64 = convertImgToBase64URL(input.files[0], sendToImgur);

}

function sendToImgur(img, previewImage, length) {
    $.ajax({
        url: "https://api.imgur.com/3/image",
        type: "POST",
        headers: {
            Authorization: "Client-ID 0aa4f7a77734f59",
            Accept: "application/json"
        },
        data: {
            image: img.split("base64,")[1],
            type: "base64"
        },
        success: function (result) {
            images.push(result.data.link);
            $(previewImage).fadeTo(500, 1);
            if (images.length === length) {
                // All images have been parsed 
                uploadPost();
            }
        }

    });
}