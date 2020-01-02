const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');
var async = require('async');
var Books = require('../models/book');
var Author = require('../models/author');

// Display list of all Authors.
exports.author_list = function(req, res, next) {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec((err, author_list) => {
            if(err){ return next(err)};

            //Successfull, so render
            res.render('author_list', { title: 'Author List', 
                all_author: author_list
                }
            );
        })

};

// Display detail page for a specific Author.
exports.author_detail = (req, res, next) => {
    async.parallel({
        author: callback => {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books: callback => {
            Books.find({'author': req.params.id}, 'title summary')
                .exec(callback)
            }
        }, (err, results) => {
            if(err) {return next(err);}
            if(results.author==null) {
                var err = new Error('Author not found');
                err.status = 404;
                return (next(err));
            }
            res.render('author_detail', {title: 'Author Detail', 
                author: results.author, 
                author_books: results.authors_books
                }
            );
        });

    };


// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', {title: 'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [
    //validate fields
    body('first_name')
        .isLength({min: 1})
        .trim()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters'),
    body('family_name')
        .isLength({min: 1})
        .trim()
        .withMessage('Family name must be specified')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth')
        .optional({checkFalsy: true})
        .isISO8601(),
    body('date_of_death', 'Invalid date of death')
        .optional({checkFalsy: true})
        .isISO8601(),
    
    //Sanitize data
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    //Process request after validation and sanitization
    (req, res, next) => {

        //Extract the validation errors from a request
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            //There are errors. Render form with sanitized values
            res.render('author_form',
                {title: 'Create Author',
                author: req.body,
                errors: errors.array() }
            );
            return;
        }
        else{
            //Data form is valid

            //Create Author object with escaped and trimmed data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            );
            //Check if Author already exists
            Author.findOne(
                {'first_name': req.body.first_name, 
                'last_name': req.body.last_name, 
                'date_of_birth': req.body.date_of_birth,
                'date_of_death': req.body.date_of_death
            }).exec( (err, found_author) => {
                if (err) { return next(err); }

                //if author exist
                else if (found_author){
                    res.redirect(found_author.url);
                }
                else{
                //if !err || !found_author then create a new Author
                author.save( err => {
                    if (err) { return next(err); }

                    //Successful - redirect to new author record
                    res.redirect(author.url);
                }); 
            }
        }); 

        }
    }
]

// Display Author delete form on GET.
exports.author_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete GET');
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author delete POST');
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};