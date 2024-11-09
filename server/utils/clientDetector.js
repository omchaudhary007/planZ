const clientDetector=(userClient)=>{
    const isBrowser = ["Chrome", "Safari", "Edge", "Firefox"].some((browser) =>
      userClient.includes(browser)
    );
    return isBrowser;
}

export default clientDetector;