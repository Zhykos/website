const sheetStr = "Hyrule Warriors: Age Of Calamity	2020	Switch	FR	Zhykos'screenshots	https://www.amazon.fr/photos/share/ny1GuV6fyWpnVM65IXFKhAIqqcBS36yvXCzqH0togsD	https://www.igdb.com/games/hyrule-warriors-age-of-calamity																				";

const columnsStr = sheetStr.split('\t');

console.log(`<div class="col-md-6 col-lg-4 item zoom-on-hover">
<a class="lightbox"
    href="${columnsStr[5]}">
    <img class="img-fluid image" src="assets/img/gallery/${getImageName(columnsStr[0])}.jpg" />
    <span class="description">
        <span class="description-heading">${columnsStr[0]}</span>
        <span class="description-body">${columnsStr[1]} - ${columnsStr[2]} - ${columnsStr[3]}</span>
    </span>
</a>
</div>`);

function getImageName(gameName) {
    return gameName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/-$/, '');
}