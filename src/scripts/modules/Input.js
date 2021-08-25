var $ = require('jquery')

function selectSession() {

    if (document.getElementById("searchSession").onkeydown = function (event) {
        if (event.keyCode == 13) {
            $(document).ready(function () {
                $("#searchSession").focusout()
            })
        }
    });

    $.fn.inputFilter = function (inputFilter) {
        return this.on("input keydown keyup mousedown mouseup select contextmenu drop each", function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {
                this.value = "";
            }
        });
    };

    $("#searchSession").inputFilter(function (value) {
        return /^-?\d*$/.test(value);
    });

}

// if (document.getElementById("searchSession").onkeydown = function (event) {



//     const isNumber = isFinite(event.key);
//     console.log(event.keyCode)
//     if (event.keyCode == 13) {
//         $(document).ready(function () {
//             $("#searchSession").focusout()
//         })
//     };

//     if (event.keyCode == 32) {
//         return false;
//     }

//     if (isNumber || event.keyCode == 8) {
//         return true;
//     } else {
//         return false;
//     }
// });