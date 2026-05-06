#include<bits/stdc++.h>
using namespace std;
int main(){
    int t; scanf("%d",&t);
    while(t--){
        int n; scanf("%d",&n);
        vector<int> v(n);
        long long mx=0;
        for(auto &x: v){ scanf("%d",&x); if(x>mx) mx=x; }
        sort(v.begin(), v.end());
        long long m=0;
        for(int i=0;i<n;i++) if(v[i]==m) m++;
        printf("%lld\n", m*m + (long long)(n-m)*(m+mx));
    }
    return 0;
}
