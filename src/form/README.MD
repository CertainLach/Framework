# Form
Form validation library

# Example
```ts
const Form=new Form({
    name:FormValidator.text('Title',[1,20]),
    items:FormValidator.multi('Items',[1,1000],{
        name:FormValidator.text('Name',[1,20]),
        count:FormValidator.select('Count',{
            [Counts.LT50]:'< 50',
            [Counts.GT50]:'> 50'
        },0)
    })
});
```