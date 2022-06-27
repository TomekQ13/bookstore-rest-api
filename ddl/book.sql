drop table if exists book;

create table book (
    id varchar(36) primary key,
    author varchar(255) not null,
    price integer not null,
    description text,
    year_published integer not null,
    added_dttm timestamp default now()
);