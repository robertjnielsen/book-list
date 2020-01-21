'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
require('ejs');

const app = express();
const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Im listening to you... on port ${PORT}`);
});

//set app to use ejs view engine (needs /views dir to be made)
app.set('view engine', 'ejs');

//import body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

//FUNCTIONS______________________
const Book = function(data) {
  this.books = data.map(book => {
    return {
      title: book.title || 'Title Unavailable',
      author: book.authors ? book.authors.join(', ') : 'No Author',
      description: book.description ? book.description.slice(0, 300) + '...' : 'Really great read...',
      image: (book.imageLinks && book.imageLinks.thumbnail) ? book.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg'
    }
  });
}

//ROUTES________________________
app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/search/new', (req, res) => {
  res.render('pages/search');
});

app.post('/search/new', (req, res) => {
  let query = req.body.type === 'author' ? 'inauthor:' : 'intitle:';
  let APIUrl = 'https://www.googleapis.com/books/v1/volumes?q=' + query + req.body.searchQuery;

  superagent
    .get(APIUrl)
    .then(results => {
      let titles = results.body.items.map(item => item.volumeInfo);
      const responseObj = new Book(titles);
      console.log(responseObj.books);
      res.status(300).render('pages/index', { books: responseObj.books });
    })
    .catch(error => {
      res.render('error', { error: error });
    })
})

app.get('*', (req, res) => {
  res.status(404).send('Sorry, the page you requested does not exist! :(');
});
