const Validator = require('validator');
const isEmpty = require('is-empty');

module.exports = function validateRepoUpdateRequest(data) {
    let errors = {};
    // Converts all empty fileds to empty string
    data.repo_name = !isEmpty(data.repo_name) ? data.repo_name : '';
    
    if (data.data.githubRepoUrl){
        errors.githubRepoUrl = "Cannot Update Repo URL";
    }

    if (data.data.title){
        errors.title = "Can't Update title of the repository."
    }

    if (data.data.blockNumber){
        errors.blockNumber = "Cannot Update Block Number manually."
    }

    if (data.data.status){
        errors.status = "Can't update status of Approval Manually. Only admins can do this."
    }

    // Name checks
    if (Validator.isEmpty(data.repo_name)) {
        errors.firstName = "Repository name field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };

}