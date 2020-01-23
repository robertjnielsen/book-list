'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
require('ejs');


//configure db
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (err) => { console.error(err) });



const app = express();
const PORT = process.env.PORT || 8081;

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Im listening to you... on port ${PORT}`);
    })
  })
  .catch(err => { console.log(err) });

//set app to use ejs view engine (needs /views dir to be made)
app.set('view engine', 'ejs');

//import body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

//FUNCTIONS______________________
const Book = function (data) {
  this.books = data.map(book => {
    return {
      title: book.title || 'Title Unavailable',
      author: book.authors ? book.authors.join(', ') : 'No Author',
      description: book.description ? book.description.slice(0, 252) + '...' : 'Really great read...',
      image: (book.imageLinks && book.imageLinks.thumbnail) ? book.imageLinks.thumbnail.replace('http:', 'https:') : 'https://i.imgur.com/J5LVHEL.jpg'
    }
  });
}

const queryShelf = () => {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then((results) => {
      return results.rows;
    })
    .catch(err => console.log(err))
}

const insertBook = (book) => {
  let SQL = 'INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';
  
}

//ROUTES________________________
app.get('/', (req, res) => {
  queryShelf()
    .then((results) => {
      res.render('pages/index', { shelf: results, count: results.length });
      //retreive array of books form DB and render index. 
    })
    .catch(err => console.error(err, 'DB query busted..'))
});

app.get('/search/new', (req, res) => {
  res.render('pages/search');
});

app.post('/search/new', (req, res) => {
  let searchType = req.body.type === 'author' ? 'inauthor:' : 'intitle:';
  let APIUrl = 'https://www.googleapis.com/books/v1/volumes?q=' + searchType + req.body.searchQuery;

  superagent.get(APIUrl)
    .then(results => {
      let titles = results.body.items.map(item => item.volumeInfo);
      const responseObj = new Book(titles);
      console.log(responseObj.books);
      res.status(300).render('pages/searches/show', { books: responseObj.books });
    })
    .catch(error => {
      res.render('error', { error: error });
    })
})


app.get('/add', (req, res) => {
  const responseBook = {
    title: 'Tylers test book!',
    description: 'wuite a lit of text for the text box. Theis i the description of the book! '
  }
  res.render('pages/new-entry-form', {book: responseBook})
})

app.post('/add', (req, res) => {
  //this route will add the book to the db and send the user to the index..
  //this routeeeeee
})

app.get('*', (req, res) => {
  res.status(404).send('Sorry, the page you requested does not exist! :(');
})
