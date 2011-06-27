var vault;
var road;
$(document).ready(function() {
    var urls = {
        list: "test.json"
    }
    vault = new Vault('roads', urls, "id");
    vault.reload(function() {
        road = vault.fetch(1304);
        road.name = 'test!';
        console.log(road);

        road.delete();
    });
});