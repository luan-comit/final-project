# final-project

This is Luan Le 's final project at ComIT NodeJS course, April 7 - July 7, 2021.

App functions to date (online at http://luancomit.herokuapp.com)

1/ Login/Register & Logout:
  + Click on Login/Register menu
  + Login or click Register new user
  + Logged-in user-email will be shown on upper left corner of the page
  + While logged-in, click logout menu to logout of the system

2/ Fetch items:
  + Choose one category and number of items you want to fetch (categories will be updated more when available)
  + Click on the link of the fetched items to see more information
  + Click to save items you want ( one by one ). User must register account to be able to save and manage saved items.
  + If the item logged User want to save is already existed in the database (someone saved it), their account will be updated with existing record information and they may get all information about the item in the past. If it is brand new, system will fetch all necessary information and save new record to their account. It may take 20s-30s or so.

3/ Manage saved items:
  + User must login to be able to manage their saved items
  + User can delete items, view graph of each item, update latest of price/date of each items. After performing update, click the display to see latest price by graph (it may take 15s to fetch updates)
  + Add items to the shop for selling

4/ Manage shop & billing:
  + Edit price and description for selling items
  + Remove, add item to the shop
  + Update and view payment transactions
  + All items are prepared for shopping at http://luancomit.herokuapp.com/shop

5/ Payment gateways:
  + API with STRIPE and PAYPAL for online user payments
  + Gather payment transaction and update to mongoDB for billing

6/ eCommerce website:
  + Online shop http://luancomit.herokuapp.com/shop
  + Checkout cart, make order, pay with stripe or paypal (sandbox)

7/ See captured images in demo pages folder for references: https://github.com/luan-comit/final-project/tree/master/demo%20pages

