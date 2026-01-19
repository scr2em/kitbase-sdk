let's build a feature flag sdk in typescript 

1. it be a mono repo where we a core package exists @kitbase/flags


2. the core package, should have 2 modes 
    a. Remote evaluation (default): Each flag evaluation makes an API call
        1. we take cacheTTL, 
    b. Local evaluation: Fetches config once and evaluates flags locally
        i. we let them specifiy the polling internal, default 60s 
        2. once the backend sends a new configuration onConfigurationChange emits flag and value 

3. it should allow accepting
    a. an sdk key required
    b. baseUrl optional 
    c. onConfigurationChange
    d. enablePersistentCache
            i. when enabled, we collect cache duration
    e. default values, which means each flag and their default value, so when the flag is disabled from the backend, we use the in app default value
    



4. it can be used on the server or on the client side 

5. it should be 100% compative wiht Open Feature Protocol


6. we will have integrtaon for angular and react once we setup the core 
    1. when configuration changes, each hook should re render to refelct the new value
    2. will use pattern @kitbase/flags-* 

7. use TDD, write the tests for the core package then start implmeneting to cover those cases and make sure they work as expected 
