//Helper function to make API calls with error handling and callbacks easier.
//isLoading should be a state modifier from the parent component that will be modified by this function to indicate loading state during the API call.
export default async function ApiCaller(apiPath, method, body = null, headers = {}, successCallback = null, errorCallback = null, setIsLoading) {

    try {
        // Prepare the request options for the fetch call
        const requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: body ? JSON.stringify(body) : null
        }; 
        setIsLoading && setIsLoading(true); //If setIsLoading callback is provided, set loading state to true before making the API call
        let response = await fetch(apiPath, requestOptions); //Call the API with the provided path, method, body, and headers
        // Check if the response is not ok (status code outside the range 200-299)
        if(!response.ok) {
            let errorText = await response.json();
            throw new Error(errorText.error || "API call failed");
        } else {
            let data = await response.json();
            successCallback && successCallback(data); //If a successCallback is provided, call it with the data
            return data; // Return the data for further use if needed (eg: const result = await ApiCaller(...); if(result) { ... })
        }
    } catch (error) {
        errorCallback && errorCallback(error);//If an errorCallback is provided, call it with the error
        return null; // Return null to indicate failure (eg: if(!result) { ... handle error ... }) (Optional, depending on how you want to handle errors in the calling function)
    } finally {
        setIsLoading && setIsLoading(false); //If setIsLoading callback is provided, set loading state to false after the API call
    }

}