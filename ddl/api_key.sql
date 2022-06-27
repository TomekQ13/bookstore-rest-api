drop table if exists api_key;

create table api_key (
    api_key varchar(36) primary key,
    valid_to_dttm timestamp not null,
    added_dttm timestamp default now()
);
