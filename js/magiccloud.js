var textArea = document.getElementById('textArea');
var myCodeMirror = CodeMirror(function(elt){
        textArea.parentNode.replaceChild(elt,textArea);
    },{
        value: textArea.value}
);


var host = "/webhdfs/v1/";
//vvar host = "http://192.168.56.2:50070/webhdfs/v1/";
var currPath = ['/'];
var currFile = "";
var setList = function (list) {
    var items = list.FileStatuses.FileStatus;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        var tr = document.createElement("tr");

        var name = document.createElement("td");
        name.textContent = item.pathSuffix;
        name.className = "item";
        $(name).appendTo(tr);

        var date = document.createElement("td");
        var vdate = new Date(item.modificationTime)
        date.textContent = vdate.toLocaleString();
        $(date).appendTo(tr);

        var size = document.createElement("td");
        size.textContent = item.length;
        $(size).appendTo(tr);

        var type = document.createElement("td");
        type.textContent = item.type;
        $(type).appendTo(tr);

        $(tr).attr("fname", item.pathSuffix);

        if (item.type === "DIRECTORY") {
            $(tr).attr("type", "dir");
        } else
            $(tr).attr("type", "file");

        $(tr).appendTo("#listTable");
    }
};
var getListStatus = function (path) {
    $.ajax({
        url: host + path + '?op=LISTSTATUS',
        type: 'GET',
        dataType: 'json',
        success: function (json) {
            setList(json)
        }
    });
};
var onListClick = function (e) {
    var tr = e.target.parentElement;
    var type = $(tr).attr("class");
    if (type === "info") {
        var suffix = tr.attributes.getNamedItem("fname").value;
        var type = tr.attributes.getNamedItem("type").value;
        if (type === "dir") {
            currPath = currPath.concat(suffix);
            cd(currPath);
        } else {
            getFile(suffix);
        }
    } else {
        $("tr").attr("class", "");
        tr.className = "info";
        currFile = tr.attributes.getNamedItem("fname").value;
    }
}
var onNavClick = function (e) {
    var index = e.target.parentElement.attributes.getNamedItem("index").value;
    currPath.splice(parseInt(index) + 1);
    cd(currPath);
}

var cd = function (path) {
    $("#nav li:nth-child(n+2)").remove();
    $("#listTable tbody").remove();
    var absPath = "";
    for (var i = 1; i < path.length; i++) {
        var tmp = $("#nav li:first-child").clone();
        tmp.on('click', onNavClick);
        tmp.children("a").text(path[i]);
        tmp.attr("index", i);
        tmp.appendTo("#nav");
        absPath += path[i] + "/";
    }
    ;
    getListStatus(absPath);
}
var onUploadClick = function () {
    $("#file").trigger('click');
}
function upload(e) {
    var path = currPath.slice(1).join("/");
    var file = e.target.files[0];
    var filename = file.name;
    var reader = new FileReader();
    reader.onload = function (e) {
        var src = e.target.result;
        $.ajax({
            type: "PUT",
            url: host + path + "/" + filename + "?user.name=hadoop&op=CREATE&overwrite=true",
            dataType: "json",
            data: src,
            contentType: "application/octet-stream",
            complete: function (ajax) {
                if (ajax.status == 201) {
                    console.log("uploaded")
                    cd(currPath)
                }
            }
        });
    };
    reader.readAsBinaryString(file);


}

function onDeleteClick() {
    var path = currPath.slice(1).join("/") + "/" + currFile;
    $.ajax({
        type: "DELETE",
        url: host + path + "?user.name=hadoop&op=DELETE&recursive=true",
        dataType: "json",
        success: function (json) {
            cd(currPath);
        }
    });
}
function onRenameClick() {
    var path = currPath.slice(1).join("/");
    var dest = $('#modalText')[0].value
    $.ajax({
        type: "PUT",
        url: host + path + "/" + currFile + "?user.name=hadoop&op=RENAME&destination=/" + path + "/" + dest,
        dataType: "json",
        success: function (json) {
            cd(currPath);
        }
    });
}

function onAddFolderClick() {
    var path = currPath.slice(1).join("/");
    var dest = $('#modalText')[0].value
    path = path + "/" + dest;
    $.ajax({
        type: "PUT",
        url: host + path + "?user.name=hadoop&op=MKDIRS",
        dataType: "json",
        success: function (json) {
            cd(currPath);
        }
    });

}
function getFile(filename) {
    var path = currPath.slice(1).join("/");
    $.ajax({
        type: "GET",
        url: host + path + "/" + filename + "?op=OPEN",
        dataType: "text",
        success: function (json) {
            myCodeMirror.setValue(json)
            $('#codeedit').tab('show');

        }
    });
}


function rename(e) {

        $('#getValueBtn').unbind('click')
        $('#getValueBtn').click(onRenameClick);
    $('#modalText')[0].value=""

}
function addFolder() {
    $('#getValueBtn').unbind('click')
    $('#getValueBtn').click(onAddFolderClick);
    $('#modalText')[0].value=""
}

$('#nav li:first-child').click(onNavClick);
$('#listTable').click(onListClick);
$('#uploadBtn').click(onUploadClick);
$('#file').change(upload);
$('#deleteBtn').click(onDeleteClick);

$('#rename').click(rename);
$('#addFolder').click(addFolder);



$('#navbar a').click(function(e){
    e.preventDefault();
    $(this).tab('show')
})
$('a[data-toggle="tab"]').on('shown', function () {
    myCodeMirror.refresh();
})




//$(".nav a").smoothScroll()


//getListStatus('/');



