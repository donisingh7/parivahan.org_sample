#include<bits/stdc++.h>
using namespace std;
int main(){
    int t; scanf("%d",&t);
    while(t--){
        int n; scanf("%d",&n);
        vector<long long> a(n);
        for(auto &x: a) scanf("%lld",&x);
        long long s = a[n-1];
        int c = s>0;
        for(int i=n-2;i>=0;i--){
            s = a[i] + max(0LL, s);
            if(s>0) c++;
        }
        printf("%d\n", c);
    }
    return 0;
}
