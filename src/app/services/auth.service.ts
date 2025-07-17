import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable, BehaviorSubject} from 'rxjs';
import { tap, filter  } from 'rxjs/operators';

export interface UserContext {
  userId: number | null;
  customerId: number | null;
  role: string | null;
  email: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userCtx$ = new BehaviorSubject<UserContext | null>(null);
  /** זורם כשהמשתמש זמין (ctx != null) */
  userReady$ = this._userCtx$.pipe(filter((ctx): ctx is UserContext => !!ctx));
  private apiUrl = 'https://k-studio.co.il/wp-json/jwt-auth/v1/token';
  private apiCustomURL = 'https://k-studio.co.il/wp-json/custom-api/v1';
  
  constructor(private http: HttpClient) {
      // אם כבר יש session מאוחסן (אפליקציה נפתחה מחדש)
  if (this.isLoggedIn() && this.getUserID()) {
    this._userCtx$.next(this.buildUserCtx());
  }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, {
      username,
      password
    });
    
  }

  private buildUserCtx(): UserContext {
    const userId = this.getUserIDNum();
    const customerId = this.getCustomerIDNum();
    const role = this.getUserRole();
    const email = this.getUserEmail();
    return { userId, customerId, role, email };
  }

  getUserIDNum(): number | null {
  const v = this.getUserID();
  return v ? Number(v) : null;
  } 

  getCustomerIDNum(): number | null {
    const v = this.getCustomerID();
    return v ? Number(v) : null;
  }

  storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  storeCustomerID(customerID: string): void {
    localStorage.setItem('customer_id', customerID);
  }
  storeUserID(userID: string): void {
    localStorage.setItem('user_id', userID);
  }

  storeUserEmail(userEmail: string): void {
    localStorage.setItem('user_email', userEmail);
  }

  storeUserRole (userRole: string) {
    localStorage.setItem('user_role', userRole);
  }

  storePackageCustomerID (packageCustomerId: string) {
    localStorage.setItem('packageCustomerId', packageCustomerId);
  }

  storeUserFullName (userFullname: string) {
    localStorage.setItem('user_fullname', userFullname);
  }

  storeUserGamiPts(userGamiPts: string){
    localStorage.setItem('user_gami', userGamiPts);
  }

  storeFavLocation(userFavLocation: string) {
    localStorage.setItem('user_fav_location', userFavLocation);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getPackageCustomerId(): string | null {
    return localStorage.getItem('packageCustomerId');
  }

  getUserID(): string | null {
    return localStorage.getItem('user_id');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }
  
  getUserFavLocation(): string {
    const temp = localStorage.getItem('user_fav_location');
    if (temp)
      return temp;
    return "";
  }

  getUserRole(): string | null{
    return localStorage.getItem('user_role');
  }

  getUserFullName(): string | null {
    return localStorage.getItem('user_fullname');
  }

  getUserGamiPts(): string | null {
    return localStorage.getItem('user_gami');
  }

  getCustomerID(): string | null {
    return localStorage.getItem('customer_id');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('customer_id');
    localStorage.removeItem('user_fullname');
    localStorage.removeItem('user_gami');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('packageCustomerId');
    localStorage.removeItem('userFilterChoice');
    this._userCtx$.next(null);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;  // Check if token exists and return true/false
  }
  
  fetchUserRole(): Observable<any> {
    const url = this.apiCustomURL+'/user-role/'+this.getUserID();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(url, { headers: headers });
  }

  fetchUserFavLocation(): Observable<any> {
    const url = this.apiCustomURL+'/get-favorite-location?user_id='+this.getUserID();

    return this.http.get(url).pipe(
      tap((locationResponse: any) => {
        this.storeFavLocation(locationResponse.favorite_location);
      })
    )
  }

  getServiceIDbyUserRole(): Observable<number> {
    const apiUrl = 'https://k-studio.co.il/wp-json/angular/v1/get-services/';
    const userRole = localStorage.getItem('user_role') || 'guest';
    return this.http.get<number>(`${apiUrl}${userRole}`);
  }

  getProviderIDbyUserRole(): Observable<number> {
    const apiUrl = 'https://k-studio.co.il/wp-json/angular/v1/get-provider/'
    const userRole = localStorage.getItem('user_role') || 'guest';
    return this.http.get<number>(`${apiUrl}${userRole}`);
  }


  // New standalone function to fetch packageCustomerId
  fetchPackageCustomerId(customerId: string | null): Observable<any> {
    const packageApiUrl = `https://k-studio.co.il/wp-json/wn/v1/package-purchases/${customerId}`;
    return this.http.get(packageApiUrl).pipe(
      tap((packageResponse: any) => {
        // Extract the packageCustomerId and store it in local storage
        if (
          packageResponse && 
          packageResponse.data && 
          packageResponse.data[0] && 
          packageResponse.data[0].packages[0] && 
          packageResponse.data[0].packages[0].purchases[0] && 
          packageResponse.data[0].packages[0].purchases[0].packageCustomerId
        ) {
          const packageCustomerId = packageResponse.data[0].packages[0].purchases[0].packageCustomerId;
          this.storePackageCustomerID(packageCustomerId);
        }
        else {
          this.storePackageCustomerID("");
        }
      })
    );
  }



}
