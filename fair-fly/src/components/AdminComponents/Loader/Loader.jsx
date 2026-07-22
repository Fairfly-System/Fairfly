import './loader.css';

//A loader that only takes up 100% of the parent component's width and height. It is used in the Admin Panel to indicate that data is being fetched from the server.
export default function Loader({text}) {

    return (
        <div className="loader-container">
            <div className="loader-spinner"></div>
            <p> {text} </p>
        </div>
    )

}

