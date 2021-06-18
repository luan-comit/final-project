

function showCart() {
    var tbl_body = document.getElementById('tbl-body');
    let itemsCart = localStorage.getItem('itemsOnCart');
    //console.log("Length: ", itemsCart.length);
    //console.log(JSON.parse(itemsCart));
    itemsCart = JSON.parse(itemsCart);
    //var len = 0;
    for (let i = 0; i < listItems.length; i++) {
        if (itemsCart[listItems[i].pos] != undefined) {
      //      len++ ;

            //console.log(itemsCart[listItems[i].pos]);

            let tr = document.createElement('tr');

            let td_img = document.createElement('td');
            td_img.setAttribute('class', 'thumbnail-tbl');
            let img = document.createElement('img');
            //console.log(itemsCart[listItems[i].pos].img_src);
            img.setAttribute('src', itemsCart[listItems[i].pos].img_src);
            img.setAttribute('class', 'cart-img-td-tbl');
            td_img.appendChild(img);
            tr.appendChild(td_img);

            let td_price = document.createElement('td');
            //console.log('$' + itemsCart[listItems[i].pos].price);
            td_price.innerText = '$' + itemsCart[listItems[i].pos].price;
            tr.appendChild(td_price);

            let td_quantity = document.createElement('td');
            td_quantity.innerText = 'x ' + itemsCart[listItems[i].pos].oncart;
            tr.appendChild(td_quantity);

            let td_total = document.createElement('td');
            td_total.innerText = '$' + (parseInt(itemsCart[listItems[i].pos].price) * parseInt(itemsCart[listItems[i].pos].oncart));
            tr.appendChild(td_total);

            tbl_body.appendChild(tr);
        }
    }

    let totalbill = localStorage.getItem('totalBill');
    console.log(totalbill);
    let tr_totalBill = document.createElement('tr');
    let td_sumBill = document.createElement('td');
    td_sumBill.setAttribute('class', 'td-sumbill')
    td_sumBill.innerText = 'SUM';
    let td_totalBill = document.createElement('td');
    td_totalBill.setAttribute('class', 'td-sumbill');
    td_totalBill.innerText = '$' + totalbill;
    
    let td_null1 = document.createElement('td');
    tr_totalBill.appendChild(td_null1);
    let td_null2 = document.createElement('td');
    tr_totalBill.appendChild(td_null2);
    
    tr_totalBill.appendChild(td_sumBill);
    tr_totalBill.appendChild(td_totalBill);
    tbl_body.appendChild(tr_totalBill);

}

function clearCart() {
    if (clearcart) {
        localStorage.clear();
        showCart();
    }
}

showCart();

//////////////////////////////////payment////////////////////////////

