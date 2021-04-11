const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=71fbb94d-58d1-4a19-9064-fddf2ef06309'; // USE YOUR KEY HERE


//Module 1 ------------------------------------------------------------

function onFetchStart() {
    $('#loading').addClass('active');
  }
  
  function onFetchEnd() {
    $('#loading').removeClass('active');
  }

async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;
    onFetchStart();
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error(error);
    } finally {
        onFetchEnd();
      }
  }
  
  fetchObjects().then(x => console.log(x)); // { info: {}, records: [{}, {},]}

  async function fetchAllCenturies() {
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;
    onFetchStart();

    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
      }
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
      let centuries = JSON.stringify(data.records)
      localStorage.setItem('centuries', centuries)
  
      return records;
    } catch (error) {
      console.error(error);
    } finally {
        onFetchEnd();
      }
  }

  async function fetchAllClassifications() {
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;
    onFetchStart();

    if (localStorage.getItem('classifications')) {
        return JSON.parse(localStorage.getItem('classifications'));
      }
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
      let classification = JSON.stringify(data.records)
      localStorage.setItem('classifications', classification)
  
      return records;
    } catch (error) {
      console.error(error);
    } finally {
        onFetchEnd();
      }
  }

  async function prefetchCategoryLists() {

    try {
      const [
        classifications, centuries
      ] = await Promise.all([
        fetchAllClassifications(),
        fetchAllCenturies()
      ]);

        // This provides a clue to the user, that there are items in the dropdown
        $('.classification-count').text(`(${ classifications.length })`);

        classifications.forEach(classification => {
            const classDropdown = $('#select-classification');
            const optionTag = $(`<option value="${classification.name}">${classification.name}</option>`)
            classDropdown.append(optionTag)
        // append a correctly formatted option tag into
        // the element with id select-classification
        });

        // This provides a clue to the user, that there are items in the dropdown
        $('.century-count').text(`(${ centuries.length })`);

        centuries.forEach(century => {
            const classDropdown = $('#select-century');
            const optionTag = $(`<option value="${century.name}">${century.name}</option>`)
            classDropdown.append(optionTag)
        // append a correctly formatted option tag into
        // the element with id select-century
        });

    } catch (error) {
      console.log(error);
    }
  }

  function buildSearchString() {
      let apiURL = `${ BASE_URL }/object?${ KEY }`;
      let classificationURL = `&classification=${ $('#select-classification').val() }`;
      let centuryURL = `&century=${ $('#select-century').val() }`;
      let keywordsURL = `&keyword=${ $('#keywords').val() }`;

      return apiURL + classificationURL + centuryURL + keywordsURL;
  }

  //Module 2 ------------------------------------------------------------

  function renderPreview(record) {
    const { 
      description,
      primaryimageurl,
      title
      } = record;
  
      return $(`
      <div class="object-preview">
        <a href="#">
          <img src="${ primaryimageurl }" />
          <h3>${ title }</h3>
        </a>
      </div>`).data('record', record)
  }
  
  
  function updatePreview(info, records) {
    const root = $('#preview');
    
    if (info.next) {
      root.find('.next')
        .data('url', info.next)
        .attr('disabled', false);
    } else {
      root.find('.next')
        .data('url', null)
        .attr('disabled', true);
    }
    
    if (info.prev) {
      root.find('.previous')
        .data('url', info.prev)
        .attr('disabled', false);
    } else {
      root.find('.previous')
        .data('url', null)
        .attr('disabled', true);
    }
    
    const resultsElement = root.find('.results');
    resultsElement.empty();
  
    records.forEach(recordElement => {
      resultsElement.append(
        renderPreview(recordElement)
      );
    });
  
    resultsElement.animate({ scrollTop: 0 }, 500);
  }

  //Module 3 ------------------------------------------------------------
  
  function renderFeature(record) {
    /**
     * We need to read, from record, the following:
     * HEADER: title, dated
     * FACTS: description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline
     * PHOTOS: images, primaryimageurl
     */

    const {
      title,
      dated,
      description,
      culture,
      style,
      technique,
      medium,
      dimensions,
      people,
      department,
      division, 
      contact,
      creditline,
      images,
      primaryimageurl
   } = record
  
    // build and return template
    return $(`<div class="object-feature">
    <header>
      <h3>${ title }</h3>
      <h4>${ dated }</h4>
    </header>
    <section class="facts">
    ${ factHTML('Description', description) }
    ${ factHTML('Culture', culture, 'culture') }
    ${ factHTML('Style', style) }
    ${ factHTML('Technique', technique, 'technique' )}
    ${ factHTML('Medium', medium ? medium.toLowerCase() : null, 'medium') }
    ${ factHTML('Dimensions', dimensions) }
    ${ 
      people 
      ? people.map(function(person) {
          return factHTML('Person', person.displayname, 'person');
      }).join('')
      : ''
    }
    ${ factHTML('Department', department) }
    ${ factHTML('Division', division) }
    ${ factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) }
    ${ factHTML('Credit', creditline) }
    </section>
    <section class="photos">
    ${ photosHTML(images, primaryimageurl) }
    </section>
  </div>`);
  }

  function searchURL(searchType, searchString) {
    return `${ BASE_URL }/object?${ KEY }&${ searchType }=${ searchString }`;
  }
  
  function factHTML(title, content, searchTerm = null) {
    // if content is empty or undefined, return an empty string ''
    if(!content) {
      return ''

    // otherwise, if there is no searchTerm, return the two spans
    } else if (searchTerm === null){
      return `<span class="title">${ title }</span>
      <span class="content">${ content }</span>`;

    // otherwise, return the two spans, with the content wrapped in an anchor tag
    } else {
        return `<span class="title">${ title }</span>
        <span class="content">
         <a href="${ searchTerm }">${ content }</a>
        </span>`
        
    }
  }

  function photosHTML(images, primaryimageurl) {
    // if images is defined AND images.length > 0, map the images to the correct image tags, 
    //then join them into a single string.  the images have a property called baseimageurl, 
    //use that as the value for src
    if(images && images.length > 0) {
      return images.map(function(image){
        `<img src="${ image.baseimageurl }" />`})
        .join('');
    } 
    
    // else if primaryimageurl is defined, return a single image tag with that as value for src
    else if(primaryimageurl) {
        return `<img src="${ primaryimageurl }" />`;
    } 
    
    // else we have nothing, so return the empty string
    else {
      return '';
    }
  }


  //Click Listeners ------------------------------------------------------------

  $('#search').on('submit', async function (event) {
    event.preventDefault();
    onFetchStart();
  
    const url = buildSearchString();
    const encodedUrl = encodeURI(url);

    try {
        const response = await fetch(encodedUrl);
        const { info, records } = await response.json();

        updatePreview(info, records)

    } catch (error) {
        console.log(error);
    } finally {
        onFetchEnd();
      }
  });

  $('#preview .next, #preview .previous').on('click', async function () {
    onFetchStart();

    try {
      const url = $(this).data('url');
      const response = await fetch(url);
      const { info, records } = await response.json();  
      
      updatePreview(info, records);
    } catch (error) {
      console.error(error);
    } finally {
      onFetchEnd();
    }
  });

  $('#preview').on('click', '.object-preview', function (event) {
    event.preventDefault(); // they're anchor tags, so don't follow the link
    // find the '.object-preview' element by using .closest() from the target
    const select = $(this).closest('.object-preview')
    const record = select.data('record')

    // recover the record from the element using the .data('record') we attached
    const featureElement = $('#feature');
    featureElement.html(renderFeature(record))
    // log out the record object to see the shape of the data
    // console.log(record)
  });

  $('#feature').on('click', 'a', async function (event) {
    const href = $(this).attr('href');
  
    if (href.startsWith('mailto:')) {
      return;
    }
  
    event.preventDefault();
  
    onFetchStart();
    try {
      let result = await fetch(href);
      let { records, info } = await result.json();
      updatePreview(records, info);
    } catch (error) {
      console.error(error)
    } finally {
      onFetchEnd();
    }
  });

prefetchCategoryLists()