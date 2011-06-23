var vault;
$(document).ready(function() {
    var urls = {
        list: "test.json"
    }
    vault = new Vault('roads', urls, "id");
    vault.reload();
});