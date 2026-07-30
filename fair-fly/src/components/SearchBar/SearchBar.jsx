import './search-bar.css';

/**
 * A search bar component.
 * @param {searchQuery: string, setSearchQuery: function, debounceSearch: boolean} param0 
 * searchQuery: The current search query string.
 * setSearchQuery: A function to update the search query state. (Passed from the parent component to the child to get the value of the search query and set it in the parent component)
 * debounceSearch: A boolean indicating whether to debounce the search.
 * @returns {JSX.Element} The search bar component.
 */
export default function SearchBar({ searchQuery, setSearchQuery, debounceSearch = false }) {

    function handleSearchChange(e) {
        const value = e.target.value;
        if (debounceSearch) {
            // Debounce the search input to reduce the number of API calls
            clearTimeout(handleSearchChange.timeout); //Clear the timeout if the user is still typing
            handleSearchChange.timeout = setTimeout(() => {
                setSearchQuery(value); //Once the timer is done, set the search query to the value of the input field
            }, 300); // Adjust the debounce delay as needed
        } else {
            setSearchQuery(value); //If debounceSearch is false, set the search query immediately
        }
    }

    return (
        <div className="search-bar-wrapper">
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => handleSearchChange(e)}/>
        </div>
    )

}