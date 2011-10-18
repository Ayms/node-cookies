//Author Naïs - Cedric Martin
//MIT license

var fs = require('fs');
var URL = require('url');

//simple empty cookie class
var Cookie = function(){}

// use method parse to load a cookie from a string
// use method toString to convert a cookie to it's raw form
// use method is_expired to check if the cookie is expired (if not expiration date set then return false)
Cookie.prototype = {
		name:"",
		value:"",
		domain:"",
		path:"",
		expires:"",
		secure:false,
		httponly:false,
		parse:function(str){
		//console.log(str);
		var p = str.toString().split(';');
			for (var i = 0 ; i < p.length ; i++){
				if (p[i].toString()!=''){
				
					if (p[i].toString().toLowerCase().trim()=='httponly'){
					this.httponly = true;
					} else if (p[i].toString().toLowerCase().trim()=='secure') {
					this.secure = true;
					} else {
					var kv = p[i].toString().split('=');
					//console.log(kv);
					kv[0] = kv[0].toString().trim();
					kv[1] = kv[1].toString().trim();
						if (kv[0].toLowerCase()=="domain"){
						this.domain = kv[1].toString();
						} else if (kv[0].toLowerCase()=="path"){
						this.path = kv[1].toString();
						} else if (kv[0].toLowerCase()=="expires"){
						this.expires = kv[1].toString();
						} else {
						this.name = kv[0].toString();
						this.value = kv[1].toString();
						}
					}
	
				}
			}
		},
		toString:function(full){
		var r = r=this.name+'='+this.value;
			if (full==true){
			r += ";domain="+this.domain;
			r += (this.expires!='')?';expires='+this.expires:'';
			r += ";path="+this.path;
				if (this.secure==true) r += ";secure";
			}
		return r;
		},
		is_expired:function(){
		if (this.expires=='') return false; // if no expires then return false
		var d = new Date();
		var cd = new Date(this.expires);
		if (cd<d) return true; // date of the cookie is before now ?
		return false;
		}
};

/*-------------------------------------------------*/
// Simple cookies management class (load/save/delete)
// file : String 
// Create and load cookies list if file is provided
/*-------------------------------------------------*/
var cookieJar = function(file){
this._cookies =  [];
//console.log(typeof file);
if (typeof file != 'undefined') this.loadFromFile(file); //
}

/*-------------------------------------------------*/
//return only cookies that match url domain
//a dot before domain mean all sub domains matches
// url  : String
// return : String of cookies name=value separated by a semicolon
/*-------------------------------------------------*/
cookieJar.prototype.cookiesForUrl = function(url){

var r = [];
var domain = URL.parse(url).hostname.toString();

var alldom = '.'+domain.substring(domain.lastIndexOf('.',domain.lastIndexOf('.')-1)+1,domain.length);

	for (var i = 0 ; i<this._cookies.length ; i++){
	if ( ((this._cookies[i].domain.substring(0,1)=='.') && (alldom==this._cookies[i].domain) ) || (this._cookies[i].domain == domain) ) r.push(this._cookies[i].toString(false));
	}
return r.join(';');
}

/*-------------------------------------------------*/
// Set cookies for the given url
// cookies : Array of cookies  ['pair=value','pair=value']
// url	   : String url of the webpage
// return  : nothing
/*-------------------------------------------------*/
cookieJar.prototype.setCookiesForUrl = function(cookies,url){
var domain = URL.parse(url).hostname.toString();
var path = URL.parse(url).pathname.toString();
var found = false;
var l = this._cookies.length;

	for (var i = 0 ; i < cookies.length ; i++){
	var c = new Cookie();
	c.parse(cookies[i]);
	if (c.domain=='') c.domain = domain;
	if (c.path=='') c.path = path.substring(0,path.lastIndexOf('/')+1);
	
		for (var j = 0 ; j < l; j++){
			if ((this._cookies[j].name==c.name) && (this._cookies[j].domain == c.domain) && (this._cookies[j].path==c.path)){
				
				//if cookie is expired delete it now
				if (c.is_expired()==true){
				this._cookies.splice(j,1);
				l = this._cookies.length;
				} else { //otherwise update the cookie with new values
				this._cookies[j] = c; 
				}
				
				found = true; //the cookie already exist so we dont need to add a new one
			}
		}
	if (!found && !c.is_expired()) this._cookies.push(c); //only add the new cookie if it is not expired
	}

}

/*-----------------------------------------------------------------------------------*/
// file : String > path the the text file that contains the cookies
// return : number of cookies loaded or false if an error occured
// the cookie file should be a one cookies per line and semicolon separated values
// name=value;domain=...;expires=...;path=...;secure
/*-----------------------------------------------------------------------------------*/
cookieJar.prototype.loadFromFile = function(file){
try{
var data = fs.readFileSync(file);
var lines = data.toString().split('\n');
var cnt = 0;

	for (var i = 0 ; i< lines.length ; i++){
		if (lines[i]!=""){
		var c = new Cookie();
		c.parse(lines[i]);
		this._cookies.push(c);
		cnt++;
		}
	}
} catch(ee){
console.log('loadFromFile Error : '+ee.message);
return false;
}
return cnt;
}

/*---------------------------------------------------------------*/
// save cookies that are not expired and have an expiration date
// file : String  (path to save the cookies list
// return : number of cookies saved of false if failed
/*---------------------------------------------------------------*/
cookieJar.prototype.saveToFile = function(file){

var r = [];

	// generate an array with cookies 
	for (var i = 0 ; i<this._cookies.length ; i++){
		
		// save only thoses that are not expired
		if (this._cookies[i].is_expired()==false && this._cookies[i].expires!=''){
		r.push(this._cookies[i].toString(true));
		}
	
	}
	
	// write the file only if there is something to save
	if (r.length>0){
	
		try {
		fs.writeFileSync(file,r.join('\n'));	
		} catch(ee){
		console.log('saveToFile Error : '+ee.message);
		return false;
		}
		
	}

return r.length;	
}

/*---------------------------------------------------------------*/
// Extract cookies belonging to url from this Jar
// url : url to match cookies
// return : a new cookieJar with extracted cookies
/*---------------------------------------------------------------*/
cookieJar.prototype.extractCookiesForUrl = function(url){
var domain = URL.parse(url).hostname.toString();
var alldom = '.'+domain.substring(domain.lastIndexOf('.',domain.lastIndexOf('.')-1)+1,domain.length);

var l = this._cookies.length;
var newJar = new cookieJar();

	var i = 0;
	while (i < l){
		if ( (alldom==this._cookies[i].domain) || (this._cookies[i].domain == domain) ){
		newJar._cookies.push(this._cookies[i]);
		this._cookies.splice(i,1);
		l = this._cookies.length;
		} else {
		i++;
		}
	}
	
//modifications Naïs - Aymeric Vitte
//do not call known url each time
var oget=newJar.cookiesForUrl;

newJar.cookiesForUrl=function() {return oget.call(this,url);};

var oset=newJar.setCookiesForUrl;

newJar.setCookiesForUrl=function(val) {oset.call(this,val,url)};
//

return newJar;
}


/*---------------------------------------------------------------------------*/
// Merge n cookieJar together
// parameters : n cookieJar objects
// return : a new cookieJar filled will all cookieJars passed in parameters
// if no params given then an empty cookieJar is returned
// TIP : pass only 1 cookieJar as param to clone it
/*---------------------------------------------------------------------------*/
var mergeJar = function(){
var newJar = new cookieJar();

	for (var i = 0 ; i < arguments.length; i++ ){
		newJar._cookies = newJar._cookies.concat(arguments[i]._cookies);
	}
return newJar;
}


exports.cookieJar = cookieJar;
exports.mergeJar = mergeJar;