#!/usr/bin/env python

import gzip
import json
import sys

data = []
compact_data = []

with gzip.open('./ncdc-merged-sfc-mntp.dat.gz', 'rb') as f:
    month = -1
    year = -1
    lat_lower_bound = -sys.maxint - 1
    lat_upper_bound = -sys.maxint - 1

    for line in f.readlines():
        numbers = [n for n in line.split() if n.strip() != '']
        if len(numbers) == 2:
            # New month/year
            month = int(numbers[0])
            year = int(numbers[1])
            lat_lower_bound = 85
            lat_upper_bound = 90
            data.append({
                'month': month,
                'year': year,
                'grid': [],
            })
            compact_data.append(month)
            compact_data.append(year)
        else:
            assert (lat_lower_bound >= -90 and lat_upper_bound >= -85)
            lng_lower_bound = 175
            lng_upper_bound = 180
            for value in numbers:
                assert (lng_lower_bound >= -180 and lng_upper_bound >= -175)
                if value == '-9999':
                    compact_data.append(0)
                else:
                    val = int(value)
                    grid_obj = {
                        'lat_lbound': lat_lower_bound,
                        'lat_ubound': lat_upper_bound,
                        'lng_lbound': lng_lower_bound,
                        'lng_ubound': lng_upper_bound,
                        'value': val/100.0,
                    }
                    data[-1]['grid'].append(grid_obj)
                    compact_data.append(val)

                lng_lower_bound -= 5
                lng_upper_bound -= 5

            lat_lower_bound -= 5
            lat_upper_bound -= 5

#with gzip.open('output.json.gz', 'wb') as f:
#    f.write(json.dumps(data, indent=2))

with open('output_compact.js', 'w') as f:
    f.write('window.DATA=');
    f.write(json.dumps(compact_data))

print 'Done'
