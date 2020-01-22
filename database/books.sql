DROP TABLE IF EXISTS books;
CREATE TABLE books (
  id PRIMARY KEY SERIAL,
  author VARCHAR
(255),
  title VARCHAR
(255),
  isbn VARCHAR
(255),
  image_url VARCHAR
(255),
  description VARCHAR
(255),
  bookshelf VARCHAR
(255)
);
