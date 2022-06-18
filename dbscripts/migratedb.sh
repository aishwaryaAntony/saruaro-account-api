# To create and migrate database
npx sequelize-cli db:create

npx sequelize-cli db:migrate

node ./dist/data/loadData.js master ./dist/data/SaguaroData.xlsx