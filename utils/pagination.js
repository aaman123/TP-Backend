/*
    function for implementing API Pagination
    consumers: Backend API functions for pagination
    producer: Node backend
    input parameters: Query snapshot from firebase, page_no and an array.
    output: Paginated response.
    author: Aman Sutariya
*/
module.exports.api_pagination = (result, page_no, repos_array) => {
    let total_documents = result.docs.length;
    let number_of_pages = Math.abs(Math.ceil((total_documents / 15) - 1));
    let document_start = 15 * page_no;
    let document_end = document_start + 15;

    if (page_no < number_of_pages && total_documents > 15)
    {
        for( let i = document_start; i < document_end ; i++ ) 
        {
            let jsonResponse = result.docs[i].data()
            // trending logic goes here
            repos_array.push(jsonResponse)
        }
    }
    else if (page_no == 0 && total_documents < 15) {
        result.docs.forEach( (r) => {
            repos_array.push(r.data());
        })
    }
    else if (page_no == number_of_pages) 
    {
        let documents_to_be_returned = total_documents - 15;
        let last_page_document_start = total_documents - documents_to_be_returned;

        for ( let i = last_page_document_start; i < total_documents; i++) 
        {
            let jsonResponse = result.docs[i].data()

            // trending logic goes here
            repos_array.push(jsonResponse)
        }
    }
    else 
    {
        console.log("page number out of bounds");
    }
}


// module.exports.api_pagination_wishlist = (result, page_no, repos_array) => {
//     let total_documents = result.docs.length;
//     let number_of_pages = Math.abs(Math.ceil((total_documents / 15) - 1));
//     let document_start = 15 * page_no;
//     let document_end = document_start + 15;

//     if (page_no < number_of_pages && total_documents > 15)
//     {
//         for( let i = document_start; i < document_end ; i++ ) 
//         {
//             let jsonResponse = result.docs[i].data()

//             // trending logic goes here
//             repos_array.push(jsonResponse)
//         }
//     }
//     else if (page_no == 0 && total_documents < 15) {
//         result.docs.forEach( (r) => {
//             repos_array.push(r.data());
//         })
//     }
//     else if (page_no == number_of_pages) 
//     {
//         let documents_to_be_returned = total_documents - 15;
//         let last_page_document_start = total_documents - documents_to_be_returned;

//         for ( let i = last_page_document_start; i < total_documents; i++) 
//         {
//             let jsonResponse = result.docs[i].data()

//             // trending logic goes here
//             repos_array.push(jsonResponse)
//         }
//     }
//     else 
//     {
//         console.log("page number out of bounds");
//     }
// }


