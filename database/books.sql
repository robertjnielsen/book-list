DROP TABLE IF EXISTS books;
CREATE TABLE books(
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(14),
  image_url VARCHAR(255),
  description VARCHAR(255),
  fullDescription VARCHAR,
  bookshelf VARCHAR(255)
);

insert into books(author, title, isbn, image_url, description, bookshelf) values ('tyler', 'roberts life', '89sdfjld99383', '38939.com', 
'its a book!', 'presitge worldwide (pitbulls picks)');
