$(document).ready(function() {
// By Default Disable radio button
$("form input:radio").change(function() {
if ($(this).val() == "dhcp") {
$(".staticConfig").attr('checked', false);
$(".staticConfig").attr('disabled', true);
}
// Else Enable radio buttons.
else {
$(".staticConfig").attr('disabled', false);
}
});
});
