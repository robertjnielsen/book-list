'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
require('ejs');


//configure db
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (err) => { console.error(err) });

const app = express();
const PORT = process.env.PORT || 8081;

//method override init
app.use(methodOverride('_method'));

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
      fulldescription: book.description || 'Really great read! We\'re serious!',
      image_url: (book.imageLinks && book.imageLinks.thumbnail) ? book.imageLinks.thumbnail.replace('http:', 'https:') : 'https://i.imgur.com/J5LVHEL.jpg',
      isbn: book.industryIdentifiers[0].identifier || null
    }
  });
}

const queryDelete = (param, value) => {
  let SQL = `DELETE FROM books WHERE ${param} = $1;`;
  let values = [value];
  return client.query(SQL, values)
    .then(results => {
      return results.rows;
    })
    .catch(err => {
      return err
    })
}

const queryShelf = () => {
  let SQL = 'SELECT * FROM books ORDER BY id desc;';
  return client.query(SQL)
    .then((results) => {
      return results.rows;
    })
    .catch(err => console.log(err))
}

const queryShelfOne = (param, value) => {
  let SQL = `SELECT * FROM books where ${param} = $1;`;
  let values = [value];
  return client.query(SQL, values)
    .then(results => {
      return results.rows;
    })
    .catch(err => console.log(err, 'error selecting a book.'))
}

const insertBook = (book) => {
  // let SQL = 'INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;';
  let SQL2 = 'INSERT INTO books (author, title, isbn, image_url, description, fulldescription, bookshelf) SELECT $1, $2, $3, $4, $5, $6, $7 WHERE NOT EXISTS (SELECT isbn FROM books WHERE isbn = $8) RETURNING id;';
  let values = [book.author, book.title, book.isbn, book.image_url, book.description, book.fulldescription, book.bookshelf, book.isbn];
  return client.query(SQL2, values)
    .then(results => {
      console.log('the id# is: ', results.rows[0]);
      return results.rows[0];
    })
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
      console.dir(results.body.items);
      let titles = results.body.items.map(item => item.volumeInfo);
      const responseObj = new Book(titles);
      console.log(responseObj);
      res.status(200).render('pages/searches/show', { books: responseObj.books });
    })
    .catch(error => {
      res.render('pages/error', { error: error });
    })
})

//fires when user clicks 'add' from results page.
app.get('/add', (req, res) => {
  const responseBook = req.query;
  res.render('pages/new-entry-form', { book: responseBook })
})

//fires when add form is submitted
app.post('/add', (req, res) => {
  queryShelfOne('isbn', req.body.isbn)
    .then(results => {
      if (results.length === 0) {
        return insertBook(req.body)
      }
    })
    .then(results => {
      console.log(results);
      res.redirect('/');
    })
    .catch(err => console.log(err, 'insert book errror'))
})


//fires when user clicks on a detail button in their library
app.get('/detail/:bookid', (req, res) => {
  queryShelfOne('id', req.params.bookid)
    .then(results => {
      res.render('pages/detail', { book: results[0] });
    })
})


//fires when user presses delete button

app.delete('/detail/:bookid', (req, res) => {
  queryDelete('id', req.params.bookid) 
    .then(results => {
      console.log(results)
    })
    .catch(err => console.log(err, 'error deleting entry'))

  res.redirect('/');
})
app.get('*', (req, res) => {
  res.status(404).send('Sorry, the page you requested does not exist! :(');
})
