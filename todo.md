<!-- Heading -->
# TODO API
## This API contain 6 EndPoints and it uses PgSql as database

<!-- Italic -->
>* _CREATE todo - We need to pass the description and the deadline for the todo we want to add. we have to pass the details in body_

>* _GET todos - Here we need to pass the offset and the limit as a query string to get the remaining todos. Bydefault it will send all todos_

>* _GET todo with id - Here we need to pass the id of todo as params we want from the server_

>* _GET todo with date - Here we have to pass the date(deadline) in body to get the todos with a particular deadline_

>* _UPDATE todo - here we need to pass id as params and the new description in the body to update the todo. it will return the updated todo_

>* _DELETE todo - Here we need to pass the id in params to delete a particular todo_